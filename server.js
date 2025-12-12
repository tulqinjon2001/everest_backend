const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection with retry and clearer defaults
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://cartoonfilm18_db_user:f83WaGCc93kc0bwq@cluster0.sqwa8uu.mongodb.net/';

async function connectWithRetry(attempts = 5, delayMs = 2000) {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected');

    // Create default teacher if doesn't exist
    const User = require('./models/User');
    const existingTeacher = await User.findOne({ role: 'teacher' });
    if (!existingTeacher) {
      await User.create({
        username: 'teacher',
        password: 'teacher123',
        role: 'teacher',
        fullName: 'Default Teacher',
        phone: '+000000000'
      });
      console.log('Default teacher created:');
      console.log('  Username: teacher');
      console.log('  Password: teacher123');
      console.log('  Please change the password after first login!');
    }

  } catch (err) {
    console.error(`MongoDB connection error (attempt ${6 - attempts}):`, err.message || err);
    if (attempts > 1) {
      console.log(`Retrying connection in ${delayMs}ms... (${attempts - 1} attempts left)`);
      setTimeout(() => connectWithRetry(attempts - 1, Math.min(30000, delayMs * 2)), delayMs);
    } else {
      console.error('Could not connect to MongoDB. Make sure MongoDB is running and MONGODB_URI is correct.');
    }
  }
}

connectWithRetry();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/students', require('./routes/students'));
app.use('/api/homework', require('./routes/homework'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

