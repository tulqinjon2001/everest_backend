const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedTeacher = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/everest_homework', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected');

    // Check if teacher already exists
    const existingTeacher = await User.findOne({ role: 'teacher' });
    if (existingTeacher) {
      console.log('Teacher already exists');
      process.exit(0);
    }

    // Create default teacher
    const teacher = await User.create({
      username: 'teacher',
      password: 'teacher123',
      role: 'teacher',
      fullName: 'Default Teacher',
      phone: '+998901234567'
    });

    console.log('Default teacher created successfully:');
    console.log('Username: teacher');
    console.log('Password: teacher123');
    console.log('Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding teacher:', error);
    process.exit(1);
  }
};

seedTeacher();

