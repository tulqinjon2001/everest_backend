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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  cb(null, true); // Allow all file types
};

// Dynamic field handling for assignments[].images
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: fileFilter
});

upload.dynamicFields = (fields) => {
  const multerFields = fields.map((field) => ({ name: field, maxCount: 10 }));
  return upload.fields(multerFields);
};

module.exports = upload;

