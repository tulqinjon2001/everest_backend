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

// All routes require authentication
router.use(protect);

// @route   GET /api/homework
// @desc    Get all homeworks
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
        { studentId: student._id },
        { groupId: student.groupId, assignmentType: 'group' }
      ];
    }

    const homeworks = await Homework.find(query)
      .populate('groupId', 'name')
      .populate('studentId', 'fullName')
      .sort({ createdAt: -1 });

    // For students, add submission status
    if (req.user.role === 'student') {
      const student = await Student.findById(req.user.studentId);
      const submissions = await HomeworkSubmission.find({
        studentId: student._id
      });

      const homeworksWithStatus = homeworks.map(hw => {
        const submission = submissions.find(sub => 
          sub.homeworkId.toString() === hw._id.toString()
        );
        return {
          ...hw.toObject(),
          submission: submission || null,
          canSubmit: !submission && hw.status === 'new'
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
      count: homeworks.length,
      data: homeworks
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
// @desc    Get single homework
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id)
      .populate('groupId', 'name')
      .populate('studentId', 'fullName phone')
      .populate('teacherId', 'fullName');

    if (!homework) {
      return res.status(404).json({
        success: false,
        message: 'Homework not found'
      });
    }

    // Check access
    if (req.user.role === 'teacher' && homework.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
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
        homework.studentId && homework.studentId.toString() === student._id.toString() ||
        homework.groupId && homework.groupId.toString() === student.groupId?.toString();

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

      return res.json({
        success: true,
        data: {
          ...homework.toObject(),
          submission: submission || null,
          canSubmit: !submission && homework.status === 'new'
        }
      });
    }

    // For teacher, get all submissions for this homework
    if (homework.assignmentType === 'group') {
      const group = await Group.findById(homework.groupId).populate('students');
      const submissions = await HomeworkSubmission.find({
        homeworkId: homework._id
      }).populate('studentId', 'fullName');

      return res.json({
        success: true,
        data: {
          ...homework.toObject(),
          submissions,
          groupStudents: group?.students || []
        }
      });
    } else {
      const submission = await HomeworkSubmission.findOne({
        homeworkId: homework._id,
        studentId: homework.studentId
      }).populate('studentId', 'fullName');

      return res.json({
        success: true,
        data: {
          ...homework.toObject(),
          submission: submission || null
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
// @desc    Create new homework
// @access  Private (Teacher only)
router.post('/', authorize('teacher'), upload.single('file'), async (req, res) => {
  try {
    const { name, description, category, assignmentType, groupId, studentId } = req.body;

    if (!name || !category || !assignmentType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, category, and assignmentType'
      });
    }

    if (!['TEXT', 'AUDIO', 'VIDEO', 'PHOTO', 'FILE'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Must be TEXT, AUDIO, VIDEO, PHOTO, or FILE'
      });
    }

    if (!['group', 'individual'].includes(assignmentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignmentType. Must be group or individual'
      });
    }

    if (assignmentType === 'group' && !groupId) {
      return res.status(400).json({
        success: false,
        message: 'groupId is required for group assignments'
      });
    }

    if (assignmentType === 'individual' && !studentId) {
      return res.status(400).json({
        success: false,
        message: 'studentId is required for individual assignments'
      });
    }

    // Verify group or student belongs to teacher
    if (assignmentType === 'group') {
      const group = await Group.findById(groupId);
      if (!group || group.teacherId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to assign homework to this group'
        });
      }
    } else {
      const student = await Student.findById(studentId);
      if (!student || student.teacherId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to assign homework to this student'
        });
      }
    }

    // Handle file upload
    let fileUrl = null;
    if (req.file) {
      fileUrl = `/uploads/${category.toLowerCase()}/${req.file.filename}`;
    } else if (category !== 'TEXT') {
      return res.status(400).json({
        success: false,
        message: 'File is required for non-TEXT categories'
      });
    }

    const homework = await Homework.create({
      name,
      description: description || '',
      category,
      fileUrl,
      teacherId: req.user._id,
      groupId: assignmentType === 'group' ? groupId : null,
      studentId: assignmentType === 'individual' ? studentId : null,
      assignmentType,
      status: 'new'
    });

    const createdHomework = await Homework.findById(homework._id)
      .populate('groupId', 'name')
      .populate('studentId', 'fullName');

    res.status(201).json({
      success: true,
      data: createdHomework
    });
  } catch (error) {
    console.error('Create homework error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/homework/:id
// @desc    Update homework
// @access  Private (Teacher only)
router.put('/:id', authorize('teacher'), upload.single('file'), async (req, res) => {
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

    const { name, description, category } = req.body;

    if (name) homework.name = name;
    if (description !== undefined) homework.description = description;
    if (category && ['TEXT', 'AUDIO', 'VIDEO', 'PHOTO', 'FILE'].includes(category)) {
      homework.category = category;
    }

    // Handle file upload
    if (req.file) {
      // Delete old file if exists
      if (homework.fileUrl) {
        const oldFilePath = path.join(__dirname, '..', homework.fileUrl);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      homework.fileUrl = `/uploads/${category.toLowerCase()}/${req.file.filename}`;
    }

    await homework.save();

    const updatedHomework = await Homework.findById(homework._id)
      .populate('groupId', 'name')
      .populate('studentId', 'fullName');

    res.json({
      success: true,
      data: updatedHomework
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
// @desc    Submit homework
// @access  Private (Student only)
router.post('/:id/submit', authorize('student'), upload.single('file'), async (req, res) => {
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

    const { textContent } = req.body;

    // Validate submission based on category
    if (homework.category === 'TEXT') {
      if (!textContent) {
        return res.status(400).json({
          success: false,
          message: 'textContent is required for TEXT category'
        });
      }
    } else {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'File is required for this homework category'
        });
      }
    }

    // Handle file upload
    let fileUrl = null;
    if (req.file) {
      fileUrl = `/uploads/${homework.category.toLowerCase()}/${req.file.filename}`;
    }

    const submission = await HomeworkSubmission.create({
      homeworkId: homework._id,
      studentId: student._id,
      submissionType: homework.category,
      textContent: homework.category === 'TEXT' ? textContent : null,
      fileUrl: homework.category !== 'TEXT' ? fileUrl : null,
      status: 'pending'
    });

    const createdSubmission = await HomeworkSubmission.findById(submission._id)
      .populate('homeworkId', 'name description category')
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
    if (teacherComment) submission.teacherComment = teacherComment;

    await submission.save();

    const updatedSubmission = await HomeworkSubmission.findById(submission._id)
      .populate('homeworkId', 'name description category')
      .populate('studentId', 'fullName');

    res.json({
      success: true,
      data: updatedSubmission
    });
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/homework/submissions/:id
// @desc    Get submission details
// @access  Private
router.get('/submissions/:id', async (req, res) => {
  try {
    const submission = await HomeworkSubmission.findById(req.params.id)
      .populate('homeworkId')
      .populate('studentId', 'fullName phone');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check access
    if (req.user.role === 'teacher') {
      if (submission.homeworkId.teacherId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }
    } else if (req.user.role === 'student') {
      if (submission.studentId._id.toString() !== req.user.studentId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

