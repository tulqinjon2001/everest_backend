const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_secret_key_here_change_in_production', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Check for user
    const user = await User.findOne({ username });

    if (!user) {
      console.log(`Login attempt failed: User '${username}' not found`);
      const debugMessage = username === 'teacher' 
        ? `User '${username}' not found. Please restart the server to create default teacher.`
        : `User '${username}' not found. Please make sure the student is created by a teacher first.`;
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        debug: debugMessage
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log(`Login attempt failed: Incorrect password for user '${username}'`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        debug: 'Incorrect password'
      });
    }

    // Get student info if role is student
    let studentInfo = null;
    if (user.role === 'student' && user.studentId) {
      studentInfo = await Student.findById(user.studentId).populate('groupId');
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        phone: user.phone,
        studentInfo: studentInfo
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    let user = req.user.toObject();
    
    // Get student info if role is student
    if (user.role === 'student' && user.studentId) {
      const studentInfo = await Student.findById(user.studentId).populate('groupId');
      user.studentInfo = studentInfo;
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

