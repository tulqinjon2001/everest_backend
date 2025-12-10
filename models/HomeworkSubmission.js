const mongoose = require('mongoose');

const homeworkSubmissionSchema = new mongoose.Schema({
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
  submissionType: {
    type: String,
    enum: ['TEXT', 'AUDIO', 'VIDEO', 'PHOTO', 'FILE'],
    required: true
  },
  textContent: {
    type: String,
    default: null
  },
  fileUrl: {
    type: String,
    default: null
  },
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HomeworkSubmission', homeworkSubmissionSchema);

