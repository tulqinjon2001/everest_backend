const express = require('express');
const Group = require('../models/Group');
const Student = require('../models/Student');
const Homework = require('../models/Homework');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/groups
// @desc    Get all groups for teacher
// @access  Private (Teacher only)
router.get('/', authorize('teacher'), async (req, res) => {
  try {
    const groups = await Group.find({ teacherId: req.user._id })
      .populate('students', 'fullName phone username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: groups.length,
      data: groups
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/groups/:id
// @desc    Get single group
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('students', 'fullName phone username');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user has access
    if (req.user.role === 'teacher' && group.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this group'
      });
    }

    if (req.user.role === 'student') {
      const student = await Student.findOne({ _id: req.user.studentId, groupId: group._id });
      if (!student) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this group'
        });
      }
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/groups
// @desc    Create new group
// @access  Private (Teacher only)
router.post('/', authorize('teacher'), async (req, res) => {
  try {
    const { name, startTime, endTime, daysOfWeek } = req.body;

    if (!name || !startTime || !endTime || !daysOfWeek || !Array.isArray(daysOfWeek)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, startTime, endTime, and daysOfWeek'
      });
    }

    const group = await Group.create({
      name,
      startTime,
      endTime,
      daysOfWeek,
      teacherId: req.user._id
    });

    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/groups/:id
// @desc    Update group
// @access  Private (Teacher only)
router.put('/:id', authorize('teacher'), async (req, res) => {
  try {
    let group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if teacher owns this group
    if (group.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this group'
      });
    }

    const { name, startTime, endTime, daysOfWeek } = req.body;

    if (name) group.name = name;
    if (startTime) group.startTime = startTime;
    if (endTime) group.endTime = endTime;
    if (daysOfWeek && Array.isArray(daysOfWeek)) group.daysOfWeek = daysOfWeek;

    await group.save();

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/groups/:id
// @desc    Delete group
// @access  Private (Teacher only)
router.delete('/:id', authorize('teacher'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if teacher owns this group
    if (group.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this group'
      });
    }

    // Remove group from students
    await Student.updateMany(
      { groupId: group._id },
      { $unset: { groupId: 1 } }
    );

    // Delete related homeworks
    await Homework.deleteMany({ groupId: group._id });

    await group.deleteOne();

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/groups/:id/students/:studentId
// @desc    Add student to group
// @access  Private (Teacher only)
router.post('/:id/students/:studentId', authorize('teacher'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    const student = await Student.findById(req.params.studentId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if teacher owns this group and student
    if (group.teacherId.toString() !== req.user._id.toString() || 
        student.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Add student to group if not already added
    if (!group.students.includes(student._id)) {
      group.students.push(student._id);
      await group.save();
    }

    // Update student's groupId
    student.groupId = group._id;
    await student.save();

    const updatedGroup = await Group.findById(req.params.id)
      .populate('students', 'fullName phone username');

    res.json({
      success: true,
      data: updatedGroup
    });
  } catch (error) {
    console.error('Add student to group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/groups/:id/students/:studentId
// @desc    Remove student from group
// @access  Private (Teacher only)
router.delete('/:id/students/:studentId', authorize('teacher'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    const student = await Student.findById(req.params.studentId);

    if (!group || !student) {
      return res.status(404).json({
        success: false,
        message: 'Group or student not found'
      });
    }

    // Check if teacher owns this group and student
    if (group.teacherId.toString() !== req.user._id.toString() || 
        student.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Remove student from group
    group.students = group.students.filter(
      id => id.toString() !== student._id.toString()
    );
    await group.save();

    // Remove groupId from student
    student.groupId = null;
    await student.save();

    const updatedGroup = await Group.findById(req.params.id)
      .populate('students', 'fullName phone username');

    res.json({
      success: true,
      data: updatedGroup
    });
  } catch (error) {
    console.error('Remove student from group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

