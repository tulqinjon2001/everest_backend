const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Homework = require('../models/Homework');

async function run() {
  const [,, id, status] = process.argv;
  if (!id || !status) {
    console.error('Usage: node scripts/setHomeworkStatus.js <HOMEWORK_ID> <status>');
    process.exit(1);
  }

  const allowed = ['new','pending','reviewed'];
  if (!allowed.includes(status)) {
    console.error('Invalid status. Allowed:', allowed.join(', '));
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/everest_homework';
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  try {
    const hw = await Homework.findById(id);
    if (!hw) {
      console.error('Homework not found:', id);
      process.exit(1);
    }
    hw.status = status;
    await hw.save();
    console.log(`Homework ${id} status set to ${status}`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
