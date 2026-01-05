const express = require('express');
const Student = require('../models/Student');
const User = require('../models/User');
const Group = require('../models/Group');
const Homework = require('../models/Homework');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/students
// @desc    Get all students for teacher
// @access  Private (Teacher only)
router.get('/', authorize('teacher'), async (req, res) => {
  try {
    const students = await Student.find({ teacherId: req.user._id })
      .populate('groupId', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/students/:id
// @desc    Get single student
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('groupId', 'name startTime endTime daysOfWeek');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if user has access
    if (req.user.role === 'teacher' && student.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this student'
      });
    }

    if (req.user.role === 'student' && req.user.studentId.toString() !== student._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this student'
      });
    }

    // Get student's homeworks and submissions
    const homeworks = await Homework.find({
      $or: [
        { studentId: student._id },
        { groupId: student.groupId, assignmentType: 'group' }
      ]
    }).sort({ createdAt: -1 });

    const submissions = await HomeworkSubmission.find({
      studentId: student._id
    }).populate('homeworkId', 'name description category');

    // Combine homeworks with submission status
    const homeworksWithStatus = homeworks.map(hw => {
      const submission = submissions.find(sub => 
        sub.homeworkId.toString() === hw._id.toString()
      );
      const now = new Date();
      const deadlinePassed = hw.deadline ? (now > new Date(hw.deadline)) : false;
      return {
        ...hw.toObject(),
        submission: submission || null,
        canSubmit: !submission && hw.status === 'new' && !deadlinePassed
      };
    });

    res.json({
      success: true,
      data: {
        student,
        homeworks: homeworksWithStatus
      }
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/students/:id/homeworks
// @desc    Get only homeworks for a student (teacher only)
// @access  Private (Teacher only)
router.get('/:id/homeworks', authorize('teacher'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Only the teacher who owns the student can access
    if (student.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this student' });
    }

    const homeworks = await Homework.find({
      $or: [
        { studentId: student._id },
        { groupId: student.groupId, assignmentType: 'group' }
      ]
    }).sort({ createdAt: -1 });

    const submissions = await HomeworkSubmission.find({ studentId: student._id })
      .populate('homeworkId', 'name description category');

    const homeworksWithStatus = homeworks.map(hw => {
      const submission = submissions.find(sub => sub.homeworkId.toString() === hw._id.toString());
      const now = new Date();
      const deadlinePassed = hw.deadline ? (now > new Date(hw.deadline)) : false;
      return {
        ...hw.toObject(),
        submission: submission || null,
        canSubmit: !submission && hw.status === 'new' && !deadlinePassed
      };
    });

    res.json({ success: true, data: { student: { _id: student._id, fullName: student.fullName, groupId: student.groupId }, homeworks: homeworksWithStatus } });
  } catch (error) {
    console.error('Get student homeworks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/students
// @desc    Create new student
// @access  Private (Teacher only)
router.post('/', authorize('teacher'), async (req, res) => {
  try {
    const { fullName, phone, username, password } = req.body;

    if (!fullName || !phone || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide fullName, phone, username, and password'
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Create student
    const student = await Student.create({
      fullName,
      phone,
      username,
      password,
      teacherId: req.user._id
    });

    // Create user account for student
    const user = await User.create({
      username,
      password,
      role: 'student',
      fullName,
      phone,
      studentId: student._id
    });

    const studentWithGroup = await Student.findById(student._id)
      .populate('groupId', 'name');

    res.status(201).json({
      success: true,
      data: studentWithGroup
    });
  } catch (error) {
    console.error('Create student error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student
// @access  Private (Teacher only)
router.put('/:id', authorize('teacher'), async (req, res) => {
  try {
    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if teacher owns this student
    if (student.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this student'
      });
    }

    const { fullName, phone, username, password } = req.body;

    if (fullName) student.fullName = fullName;
    if (phone) student.phone = phone;
    if (username) {
      // Check if new username is available
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: student._id } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
      student.username = username;
    }
    if (password) student.password = password;

    await student.save();

    // Update user account
    const user = await User.findOne({ studentId: student._id });
    if (user) {
      if (fullName) user.fullName = fullName;
      if (phone) user.phone = phone;
      if (username) user.username = username;
      if (password) user.password = password;
      await user.save();
    }

    const updatedStudent = await Student.findById(student._id)
      .populate('groupId', 'name');

    res.json({
      success: true,
      data: updatedStudent
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete student
// @access  Private (Teacher only)
router.delete('/:id', authorize('teacher'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if teacher owns this student
    if (student.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this student'
      });
    }

    // Remove student from groups
    await Group.updateMany(
      { students: student._id },
      { $pull: { students: student._id } }
    );

    // Delete related homeworks
    await Homework.deleteMany({ studentId: student._id });

    // Delete submissions
    await HomeworkSubmission.deleteMany({ studentId: student._id });

    // Delete user account
    await User.findOneAndDelete({ studentId: student._id });

    // Delete student
    await student.deleteOne();

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

