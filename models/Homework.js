const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  // Optional deadline for the homework
  deadline: {
    type: Date,
    default: null
  },
  category: {
    type: String,
    enum: ['TEXT', 'AUDIO', 'VIDEO', 'PHOTO', 'FILE'],
    required: true
  },
  fileUrl: {
    type: String,
    default: null
  },
  // Optional external link (e.g., YouTube) for the homework
  link: {
    type: String,
    default: null
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: null
  },
  assignmentType: {
    type: String,
    enum: ['group', 'individual'],
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'pending', 'reviewed'],
    default: 'new'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Homework', homeworkSchema);

