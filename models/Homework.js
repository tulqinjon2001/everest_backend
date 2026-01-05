const mongoose = require('mongoose');

// Rasm sxemasi - har bir topshiriqdagi rasmlar uchun
const ImageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  mimetype: {
    type: String
  },
  size: {
    type: Number
  },
  url: {
    type: String
  }
}, { _id: false });

// Topshiriq sxemasi - har bir task uchun
const AssignmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  images: [ImageSchema]
});

// Asosiy Homework sxemasi
const HomeworkSchema = new mongoose.Schema({
  description: {
    type: String,
    default: ''
  },
  deadline: {
    type: Date,
    default: null
  },
  category: {
    type: String,
    enum: ['TEXT', 'AUDIO', 'VIDEO', 'PHOTO', 'FILE', 'DOCUMENT'],
    required: true
  },
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
  studentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  assignmentType: {
    type: String,
    enum: ['group', 'individual'],
    required: true
  },
  // Ko'p topshiriqlar massivi
  assignments: [AssignmentSchema],
  status: {
    type: String,
    enum: ['new', 'pending', 'reviewed'],
    default: 'new'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Homework', HomeworkSchema);

