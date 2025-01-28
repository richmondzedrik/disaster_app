const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    
    if (!validImageTypes.includes(file.mimetype) && !validVideoTypes.includes(file.mimetype)) {
      return cb(new Error('Only image and video files are allowed!'), false);
    }
    cb(null, true);
  }
});

module.exports = upload;