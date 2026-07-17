const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'profile-doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File Type Validation: PDF, JPG, JPEG, PNG
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed files: ${allowedExtensions.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

/**
 * @desc    Upload profile document (resume, aadhaar, pan, marksheet)
 * @route   POST /api/auth/document/:type
 * @access  Private (Student/User)
 */
const uploadProfileDocument = async (req, res, next) => {
  try {
    const { type } = req.params;
    const allowedTypes = ['resume', 'aadhaar', 'pan', 'marksheet'];
    if (!allowedTypes.includes(type)) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Invalid document type.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded or file rejected by validator.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Delete old physical file if exists to replace it
    const oldFileUrl = user.documents?.[type];
    if (oldFileUrl) {
      const oldFilepath = path.join(__dirname, '..', '..', oldFileUrl);
      if (fs.existsSync(oldFilepath)) {
        try {
          fs.unlinkSync(oldFilepath);
        } catch (err) {
          console.error('Failed to delete old file:', err.message);
        }
      }
    }

    // Save new file details
    if (!user.documents) {
      user.documents = {};
    }
    user.documents[type] = `/public/uploads/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      success: true,
      message: `${type.toUpperCase()} uploaded successfully`,
      data: {
        user,
      }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {}
    }
    next(error);
  }
};

/**
 * @desc    Get/Download/Preview profile document
 * @route   GET /api/auth/document/:type
 * @access  Private (Owner, Teacher, Recruiter, Admin)
 */
const getProfileDocument = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { download } = req.query;
    const allowedTypes = ['resume', 'aadhaar', 'pan', 'marksheet'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid document type.' });
    }

    // Determine target user id: defaults to logged-in user, but teachers/recruiters/admins can request a specific userId via query
    let targetUserId = req.user.id;
    if (req.query.userId && req.user.role !== 'user') {
      targetUserId = req.query.userId;
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Authorization checks:
    // Students can only view/download their own documents
    if (req.user.role === 'user' && targetUserId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You cannot view another student\'s documents.' });
    }

    // Teachers/Recruiters can download if scoped correctly (already verified by general page view auth, but let's check college)
    if (req.user.role !== 'admin' && req.user.id !== targetUserId) {
      if (req.user.university?.name && user.university?.name !== req.user.university.name) {
        return res.status(403).json({ success: false, message: 'Access denied. Student belongs to another college.' });
      }
    }

    const fileUrl = user.documents?.[type];
    if (!fileUrl) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const filepath = path.join(__dirname, '..', '..', fileUrl);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: 'Physical file is missing from storage.' });
    }

    if (download === 'true') {
      res.download(filepath, `${type}-${user.name.replace(/\s+/g, '_')}${path.extname(filepath)}`);
    } else {
      res.sendFile(filepath);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  uploadProfileDocument,
  getProfileDocument,
};
