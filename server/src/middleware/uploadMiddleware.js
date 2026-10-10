const multer = require('multer');

// Multer in-memory storage configuration (prevents ephemeral disk leaks on Render)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB ceiling; bucket-specific constraints enforced per policy
});

/**
 * Flexible middleware that accepts either 'logo' or 'file' form-data field
 */
const uploadLogo = (req, res, next) => {
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) return next(err);
    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        req.file = req.files.logo[0];
      } else if (req.files.file && req.files.file[0]) {
        req.file = req.files.file[0];
      }
    }
    next();
  });
};

/**
 * Flexible middleware that accepts either 'screenshot' or 'file' form-data field
 */
const uploadScreenshot = (req, res, next) => {
  upload.fields([
    { name: 'screenshot', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) return next(err);
    if (req.files) {
      if (req.files.screenshot && req.files.screenshot[0]) {
        req.file = req.files.screenshot[0];
      } else if (req.files.file && req.files.file[0]) {
        req.file = req.files.file[0];
      }
    }
    next();
  });
};

module.exports = {
  upload,
  uploadLogo,
  uploadScreenshot,
};
