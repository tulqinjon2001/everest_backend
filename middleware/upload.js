const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const category = req.body.category || 'FILE';
    const categoryDir = path.join(uploadsDir, category.toLowerCase());
    
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    cb(null, categoryDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const category = req.body.category || 'FILE';
  
  const allowedTypes = {
    'AUDIO': ['.mp3', '.wav', '.ogg', '.m4a', '.aac'],
    'VIDEO': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'],
    'PHOTO': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    'FILE': ['.pdf', '.doc', '.docx', '.txt', '.zip', '.rar', '.xls', '.xlsx', '.ppt', '.pptx']
  };
  
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = allowedTypes[category] || allowedTypes['FILE'];
  
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for category ${category}. Allowed: ${allowed.join(', ')}`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: fileFilter
});

module.exports = upload;

