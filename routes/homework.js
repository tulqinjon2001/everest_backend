const express = require('express');
const Homework = require('../models/Homework');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const Student = require('../models/Student');
const Group = require('../models/Group');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Helper function to build full URL for images
const buildImageUrl = (req, filename, category) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${category.toLowerCase()}/${filename}`;
};

// All routes require authentication
router.use(protect);

// @route   GET /api/homework
// @desc    Get all homeworks with assignments
// @access  Private
router.get('/', async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'teacher') {
      query.teacherId = req.user._id;
    } else if (req.user.role === 'student') {
      const student = await Student.findById(req.user.studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      query.$or = [
        { studentIds: student._id },
        { groupId: student.groupId, assignmentType: 'group' }
      ];
    }

    const homeworks = await Homework.find(query)
      .populate('groupId', 'name')
      .populate('studentIds', 'fullName')
      .sort({ createdAt: -1 });

    // Build full URLs for all images in assignments
    const homeworksWithUrls = homeworks.map(hw => {
      const hwObj = hw.toObject();
      if (hwObj.assignments && hwObj.assignments.length > 0) {
        hwObj.assignments = hwObj.assignments.map(assignment => ({
          ...assignment,
          images: assignment.images ? assignment.images.map(img => ({
            ...img,
            url: buildImageUrl(req, img.filename, hwObj.category)
          })) : []
        }));
      }
      return hwObj;
    });

    // For students, add submission status
    if (req.user.role === 'student') {
      const student = await Student.findById(req.user.studentId);
      const submissions = await HomeworkSubmission.find({
        studentId: student._id
      });

      const homeworksWithStatus = homeworksWithUrls.map(hw => {
        const submission = submissions.find(sub => 
          sub.homeworkId.toString() === hw._id.toString()
        );
        const now = new Date();
        const deadlinePassed = hw.deadline ? (now > new Date(hw.deadline)) : false;
        return {
          ...hw,
          submission: submission || null,
          canSubmit: !submission && hw.status === 'new' && !deadlinePassed
        };
      });

      return res.json({
        success: true,
        count: homeworksWithStatus.length,
        data: homeworksWithStatus
      });
    }

    res.json({
      success: true,
      count: homeworksWithUrls.length,
      data: homeworksWithUrls
    });
  } catch (error) {
    console.error('Get homeworks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/homework/:id
// @desc    Get single homework with assignments
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id)
      .populate('groupId', 'name')
      .populate('studentIds', 'fullName phone')
      .populate('teacherId', 'fullName');

    if (!homework) {
      return res.status(404).json({
        success: false,
        message: 'Homework not found'
      });
    }

    // Check access
    if (req.user.role === 'teacher' && homework.teacherId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Build full URLs for images
    const hwObj = homework.toObject();
    if (hwObj.assignments && hwObj.assignments.length > 0) {
      hwObj.assignments = hwObj.assignments.map(assignment => ({
        ...assignment,
        images: assignment.images ? assignment.images.map(img => ({
          ...img,
          url: buildImageUrl(req, img.filename, hwObj.category)
        })) : []
      }));
    }

    if (req.user.role === 'student') {
      const student = await Student.findById(req.user.studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      const hasAccess = 
        (homework.studentIds && homework.studentIds.some(s => s._id.toString() === student._id.toString())) ||
        (homework.groupId && homework.groupId._id.toString() === student.groupId?.toString());

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }

      // Get submission if exists
      const submission = await HomeworkSubmission.findOne({
        homeworkId: homework._id,
        studentId: student._id
      });

      const now = new Date();
      const deadlinePassed = homework.deadline ? (now > new Date(homework.deadline)) : false;
      return res.json({
        success: true,
        data: {
          ...hwObj,
          submission: submission || null,
          canSubmit: !submission && homework.status === 'new' && !deadlinePassed
        }
      });
    }

    // For teacher, get all submissions for this homework
    if (homework.assignmentType === 'group') {
      const group = await Group.findById(homework.groupId).populate('students');
      const submissions = await HomeworkSubmission.find({
        homeworkId: homework._id
      }).populate('studentId', 'fullName');

      // Add submission status to each group student
      const groupStudentsWithStatus = (group?.students || []).map(student => {
        const submission = submissions.find(s => s.studentId._id.toString() === student._id.toString());
        return {
          _id: student._id,
          fullName: student.fullName,
          phone: student.phone,
          submitted: !!submission,
          submittedAt: submission?.createdAt || null,
          submission: submission || null
        };
      });

      return res.json({
        success: true,
        data: {
          ...hwObj,
          submissions,
          groupStudents: groupStudentsWithStatus
        }
      });
    } else {
      // Individual assignment - get submissions for all assigned students
      const submissions = await HomeworkSubmission.find({
        homeworkId: homework._id,
        studentId: { $in: homework.studentIds.map(s => s._id) }
      }).populate('studentId', 'fullName');

      // Add submission status to each student in studentIds
      const studentIdsWithStatus = hwObj.studentIds.map(student => {
        const submission = submissions.find(s => s.studentId._id.toString() === student._id.toString());
        return {
          _id: student._id,
          fullName: student.fullName,
          phone: student.phone,
          submitted: !!submission,
          submittedAt: submission?.createdAt || null,
          submission: submission || null
        };
      });

      return res.json({
        success: true,
        data: {
          ...hwObj,
          studentIds: studentIdsWithStatus,
          submissions: submissions
        }
      });
    }
  } catch (error) {
    console.error('Get homework error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/homework
// @desc    Create new homework with multiple assignments
// @access  Private (Teacher only)
router.post('/', authorize('teacher'), upload.any(), async (req, res, next) => {
  try {
    console.log('=== DEBUG: req.body ===');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('=== DEBUG: req.body keys ===');
    console.log(Object.keys(req.body));
    console.log('=== DEBUG: req.files ===');
    if (req.files) {
      console.log(req.files.map(f => ({ fieldname: f.fieldname, filename: f.filename })));
    }

    const {
      description,
      deadline,
      category,
      link,
      assignmentType,
      studentId,
      groupId
    } = req.body;

    const teacherId = req.user._id;

    // 1. Parse assignments - FIRST check form-data fields, then JSON array
    let assignments = [];
    const assignmentsData = {};
    
    // First, try to parse from form-data fields like assignments[0][name]
    for (const key in req.body) {
      let match = key.match(/assignments\[(\d+)\]\[(\w+)\]/);
      if (!match) match = key.match(/assignments\[(\d+)\]\.(\w+)/);
      if (!match) match = key.match(/assignments\.(\d+)\.(\w+)/);
      
      if (match) {
        const index = match[1];
        const property = match[2];
        if (!assignmentsData[index]) {
          assignmentsData[index] = { images: [] };
        }
        assignmentsData[index][property] = req.body[key];
      }
    }
    
    // Convert form-data parsed assignments to array
    const formDataAssignments = Object.keys(assignmentsData)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(key => assignmentsData[key])
      .filter(a => a.name);
    
    if (formDataAssignments.length > 0) {
      // Use form-data parsed assignments
      assignments = formDataAssignments;
    } else if (req.body.assignments) {
      // Fallback: If assignments is already an array (parsed JSON)
      if (Array.isArray(req.body.assignments)) {
        assignments = req.body.assignments.map(a => ({
          name: a.name,
          images: []
        }));
      } 
      // If assignments is a JSON string
      else if (typeof req.body.assignments === 'string') {
        try {
          const parsed = JSON.parse(req.body.assignments);
          assignments = parsed.map(a => ({
            name: a.name,
            images: []
          }));
        } catch (e) {
          console.log('Failed to parse assignments JSON string:', e);
        }
      }
    }

    // 2. Parse files and attach to corresponding assignments
    // Supports both 'images' and 'files' field names
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        let match = file.fieldname.match(/assignments\[(\d+)\]\[(images|files)\]/);
        if (!match) match = file.fieldname.match(/assignments\[(\d+)\]\.(images|files)/);
        
        if (match) {
          const index = parseInt(match[1]);
          if (assignments[index]) {
            if (!assignments[index].images) {
              assignments[index].images = [];
            }
            assignments[index].images.push({
              filename: file.filename,
              path: file.path,
              mimetype: file.mimetype,
              size: file.size
            });
          }
        }
      });
    }

    console.log('Parsed assignments:', JSON.stringify(assignments, null, 2));

    if (!assignments || assignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Assignments are required. Each assignment must have a name.'
      });
    }

    // Handle studentIds for individual assignments
    let studentIdsArray = [];
    if (assignmentType === 'individual') {
      // Get studentIds array (can be from studentIds or studentId)
      if (req.body.studentIds) {
        studentIdsArray = Array.isArray(req.body.studentIds) 
          ? req.body.studentIds 
          : [req.body.studentIds];
      } else if (studentId) {
        studentIdsArray = Array.isArray(studentId) ? studentId : [studentId];
      }

      // Filter out invalid ObjectIds
      studentIdsArray = studentIdsArray.filter(id => {
        if (typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id)) {
          return true;
        }
        return false;
      });

      if (studentIdsArray.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one valid student is required for individual assignments.'
        });
      }
    }

    // Create single homework with studentIds array
    const newHomework = new Homework({
      teacherId,
      description,
      deadline: deadline || null,
      category,
      link,
      assignmentType,
      studentIds: assignmentType === 'individual' ? studentIdsArray : [],
      groupId: assignmentType === 'group' ? groupId : null,
      assignments,
      status: 'new'
    });

    // Save homework to database
    const homework = await newHomework.save();

    // Build response with full image URLs
    const hwObj = homework.toObject();
    if (hwObj.assignments && hwObj.assignments.length > 0) {
      hwObj.assignments = hwObj.assignments.map(assignment => ({
        ...assignment,
        images: assignment.images ? assignment.images.map(img => ({
          ...img,
          url: buildImageUrl(req, img.filename, category)
        })) : []
      }));
    }

    res.status(201).json({
      success: true,
      data: hwObj
    });

  } catch (error) {
    console.error('Create homework error:', error);
    // Cleanup uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, err => {
          if (err) console.error(`Error deleting file ${file.path}:`, err);
        });
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while creating homework.'
    });
  }
});

// @route   PUT /api/homework/:id
// @desc    Update homework with multiple assignments
// @access  Private (Teacher only)
router.put('/:id', authorize('teacher'), upload.any(), async (req, res) => {
  try {
    let homework = await Homework.findById(req.params.id);

    if (!homework) {
      return res.status(404).json({
        success: false,
        message: 'Homework not found'
      });
    }

    // Check if teacher owns this homework
    if (homework.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this homework'
      });
    }

    // Check if any student has submitted
    const hasSubmission = await HomeworkSubmission.exists({
      homeworkId: homework._id
    });

    if (hasSubmission) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update homework that has been submitted by students'
      });
    }

    console.log('=== PUT DEBUG: req.body ===');
    console.log(JSON.stringify(req.body, null, 2));

    const { description, deadline, category, link, assignmentType, groupId, studentId } = req.body;

    // Update basic fields
    if (description !== undefined) homework.description = description;
    if (deadline !== undefined) homework.deadline = deadline || null;
    if (category && ['TEXT', 'AUDIO', 'VIDEO', 'PHOTO', 'FILE', 'DOCUMENT'].includes(category)) {
      homework.category = category;
    }
    if (link !== undefined) homework.link = link;
    
    // Handle assignmentType change
    if (assignmentType) {
      homework.assignmentType = assignmentType;
      
      if (assignmentType === 'individual') {
        // Clear groupId when switching to individual
        homework.groupId = null;
        
        // Set studentIds array
        if (req.body.studentIds) {
          let studentIdsArray = Array.isArray(req.body.studentIds) 
            ? req.body.studentIds 
            : [req.body.studentIds];
          
          // Filter valid ObjectId strings (24 hex characters)
          studentIdsArray = studentIdsArray.filter(id => 
            typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)
          );
          
          homework.studentIds = studentIdsArray;
        }
      } else if (assignmentType === 'group') {
        // Clear studentIds when switching to group
        homework.studentIds = [];
        if (groupId) {
          homework.groupId = groupId;
        }
      }
    } else {
      // If assignmentType not changed but studentIds provided, update them
      if (req.body.studentIds && homework.assignmentType === 'individual') {
        let studentIdsArray = Array.isArray(req.body.studentIds) 
          ? req.body.studentIds 
          : [req.body.studentIds];
        
        studentIdsArray = studentIdsArray.filter(id => 
          typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)
        );
        
        homework.studentIds = studentIdsArray;
      }
    }

    // Parse assignments - handle both JSON array and form-data formats
    let assignments = [];
    const assignmentsData = {};
    
    // First try form-data fields like assignments[0][name]
    for (const key in req.body) {
      let match = key.match(/assignments\[(\d+)\]\[(\w+)\](?:\[(\d+)\])?/);
      
      if (match) {
        const index = match[1];
        const property = match[2];
        const subIndex = match[3];
        
        if (!assignmentsData[index]) {
          assignmentsData[index] = { images: [], existingImages: [] };
        }
        
        if (property === 'existingImages' && subIndex !== undefined) {
          assignmentsData[index].existingImages.push(req.body[key]);
        } else if (property === 'name') {
          assignmentsData[index].name = req.body[key];
        } else if (property !== 'existingImages') {
          assignmentsData[index][property] = req.body[key];
        }
      }
    }

    // Convert form-data to array
    const formDataAssignments = Object.keys(assignmentsData)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(key => assignmentsData[key])
      .filter(a => a.name);

    if (formDataAssignments.length > 0) {
      assignments = formDataAssignments;
    } else if (req.body.assignments) {
      // Fallback: If assignments is already an array (parsed JSON)
      if (Array.isArray(req.body.assignments)) {
        assignments = req.body.assignments.map(a => ({
          name: a.name,
          images: [],
          existingImages: a.existingImages || []
        }));
      } else if (typeof req.body.assignments === 'string') {
        try {
          const parsed = JSON.parse(req.body.assignments);
          assignments = parsed.map(a => ({
            name: a.name,
            images: [],
            existingImages: a.existingImages || []
          }));
        } catch (e) {
          console.log('Failed to parse assignments JSON:', e);
        }
      }
    }

    // Process existing images - convert URLs back to file info
    assignments = assignments.map(assignment => {
      const images = [];
      
      // Add existing images (extract filename from URL)
      if (assignment.existingImages && assignment.existingImages.length > 0) {
        assignment.existingImages.forEach(url => {
          const filename = url.split('/').pop();
          const existingImg = homework.assignments
            .flatMap(a => a.images || [])
            .find(img => img.filename === filename);
          
          if (existingImg) {
            images.push(existingImg);
          } else {
            images.push({
              filename: filename,
              path: `uploads/${homework.category.toLowerCase()}/${filename}`,
              url: url
            });
          }
        });
      }
      
      return {
        name: assignment.name,
        images: images
      };
    });

    // Add new uploaded files
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        let match = file.fieldname.match(/assignments\[(\d+)\]\[(images|files)\]/);
        
        if (match) {
          const index = parseInt(match[1]);
          if (assignments[index]) {
            assignments[index].images.push({
              filename: file.filename,
              path: file.path,
              mimetype: file.mimetype,
              size: file.size
            });
          }
        }
      });
    }

    console.log('PUT Parsed assignments:', JSON.stringify(assignments, null, 2));

    // Update assignments if provided
    if (assignments.length > 0) {
      homework.assignments = assignments;
    }

    await homework.save();

    // Build response with full image URLs
    const hwObj = homework.toObject();
    if (hwObj.assignments && hwObj.assignments.length > 0) {
      hwObj.assignments = hwObj.assignments.map(assignment => ({
        ...assignment,
        images: assignment.images ? assignment.images.map(img => ({
          ...img,
          url: buildImageUrl(req, img.filename, hwObj.category)
        })) : []
      }));
    }

    // Populate for response
    const populatedHomework = await Homework.findById(homework._id)
      .populate('groupId', 'name')
      .populate('studentId', 'fullName');

    const finalResponse = populatedHomework.toObject();
    if (finalResponse.assignments && finalResponse.assignments.length > 0) {
      finalResponse.assignments = finalResponse.assignments.map(assignment => ({
        ...assignment,
        images: assignment.images ? assignment.images.map(img => ({
          ...img,
          url: buildImageUrl(req, img.filename, finalResponse.category)
        })) : []
      }));
    }

    res.json({
      success: true,
      data: finalResponse
    });
  } catch (error) {
    console.error('Update homework error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/homework/:id
// @desc    Delete homework
// @access  Private (Teacher only)
router.delete('/:id', authorize('teacher'), async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id);

    if (!homework) {
      return res.status(404).json({
        success: false,
        message: 'Homework not found'
      });
    }

    // Check if teacher owns this homework
    if (homework.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this homework'
      });
    }

    // Check if any student has submitted
    const hasSubmission = await HomeworkSubmission.exists({
      homeworkId: homework._id
    });

    if (hasSubmission) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete homework that has been submitted by students'
      });
    }

    // Delete file if exists
    if (homework.fileUrl) {
      const filePath = path.join(__dirname, '..', homework.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await homework.deleteOne();

    res.json({
      success: true,
      message: 'Homework deleted successfully'
    });
  } catch (error) {
    console.error('Delete homework error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/homework/:id/submit
// @desc    Submit homework with answers for each assignment
// @access  Private (Student only)
router.post('/:id/submit', authorize('student'), upload.any(), async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id);

    if (!homework) {
      return res.status(404).json({
        success: false,
        message: 'Homework not found'
      });
    }

    const student = await Student.findById(req.user.studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if student has access to this homework
    const hasAccess = 
      (homework.studentId && homework.studentId.toString() === student._id.toString()) ||
      (homework.groupId && homework.groupId.toString() === student.groupId?.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this homework'
      });
    }

    // Check if already submitted
    const existingSubmission = await HomeworkSubmission.findOne({
      homeworkId: homework._id,
      studentId: student._id
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'Homework has already been submitted and cannot be resubmitted'
      });
    }

    // Reject if deadline passed
    if (homework.deadline) {
      const now = new Date();
      const deadlineDate = new Date(homework.deadline);
      if (now > deadlineDate) {
        return res.status(400).json({
          success: false,
          message: 'Deadline has passed. Submission is not allowed.'
        });
      }
    }

    // Parse answers from req.body and req.files
    const answersData = {};
    
    // Parse text answers: answers[0][textContent], answers[0][assignmentId]
    for (const key in req.body) {
      const match = key.match(/answers\[(\d+)\]\[(textContent|assignmentId)\]/);
      if (match) {
        const index = match[1];
        const property = match[2];
        if (!answersData[index]) {
          answersData[index] = {};
        }
        answersData[index][property] = req.body[key];
      }
    }

    // Parse file answers
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const match = file.fieldname.match(/answers\[(\d+)\]\[file\]/);
        if (match) {
          const index = match[1];
          if (!answersData[index]) {
            answersData[index] = {};
          }
          answersData[index].fileUrl = `/uploads/${homework.category.toLowerCase()}/${file.filename}`;
          answersData[index].filename = file.filename;
        }
      });
    }

    const answers = Object.values(answersData).map(answer => {
      // Find assignment name by ID
      const assignment = homework.assignments.find(
        a => a._id.toString() === answer.assignmentId
      );
      return {
        assignmentId: answer.assignmentId,
        assignmentName: assignment ? assignment.name : null,
        textContent: answer.textContent || null,
        fileUrl: answer.fileUrl || null,
        filename: answer.filename || null
      };
    });

    if (!answers || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one answer is required for submission'
      });
    }

    const submission = await HomeworkSubmission.create({
      homeworkId: homework._id,
      studentId: student._id,
      answers,
      status: 'pending'
    });

    // For individual assignments, mark parent homework as pending
    try {
      if (homework.assignmentType === 'individual') {
        await Homework.findByIdAndUpdate(homework._id, { $set: { status: 'pending' } });
      }
    } catch (err) {
      console.error('Failed to update homework status after submission:', err);
    }

    const createdSubmission = await HomeworkSubmission.findById(submission._id)
      .populate('homeworkId', 'description category assignments')
      .populate('studentId', 'fullName');

    res.status(201).json({
      success: true,
      data: createdSubmission,
      message: 'Homework submitted successfully. You cannot change it after submission.'
    });
  } catch (error) {
    console.error('Submit homework error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/homework/submissions/:id/review
// @desc    Review homework submission
// @access  Private (Teacher only)
router.put('/submissions/:id/review', authorize('teacher'), async (req, res) => {
  try {
    const { status, teacherComment } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid status (approved or rejected)'
      });
    }

    const submission = await HomeworkSubmission.findById(req.params.id)
      .populate('homeworkId');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

        // Check if teacher owns the homework
        if (submission.homeworkId.teacherId.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to review this submission'
          });
        }
    
        submission.status = status;
        if (teacherComment !== undefined) {
          submission.teacherComment = teacherComment;
        }
        submission.reviewedAt = new Date();
    
        await submission.save();
    
        // For individual assignments, update parent homework status to match review result
        try {
          if (submission.homeworkId && submission.homeworkId.assignmentType === 'individual') {
            await Homework.findByIdAndUpdate(submission.homeworkId._id, { $set: { status } });
          }
        } catch (err) {
          console.error('Failed to update homework status after review:', err);
        }
    
        const updatedSubmission = await HomeworkSubmission.findById(submission._id)
          .populate('homeworkId', 'name description category assignmentType')
          .populate('studentId', 'fullName');
    
        res.json({
          success: true,
          data: updatedSubmission,
          message: 'Submission reviewed successfully'
        });
      } catch (error) {
        console.error('Review submission error:', error);
        res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
    });
    
    module.exports = router;

