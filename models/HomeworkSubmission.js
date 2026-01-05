const mongoose = require('mongoose');

// Har bir topshiriqqa javob sxemasi
const AnswerSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  assignmentName: {
    type: String
  },
  textContent: {
    type: String,
    default: null
  },
  fileUrl: {
    type: String,
    default: null
  },
  filename: {
    type: String,
    default: null
  }
});

// Asosiy HomeworkSubmission sxemasi
const HomeworkSubmissionSchema = new mongoose.Schema({
  homeworkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Homework',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  // Ko'p topshiriqlarga javoblar massivi
  answers: [AnswerSchema],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  teacherComment: {
    type: String,
    default: null
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HomeworkSubmission', HomeworkSubmissionSchema);

