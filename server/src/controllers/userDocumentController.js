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
 * @desc    Upload profile document (resume, transcript, projectReport, internshipOffer, etc.)
 * @route   POST /api/auth/document/:type
 * @access  Private (Student/User)
 */
const uploadProfileDocument = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { title, description } = req.body;
    const allowedTypes = [
      'resume', 'aadhaar', 'pan', 'marksheet',
      'transcript', 'projectReport', 'internshipOffer', 'internshipCompletion', 'experienceLetter', 'researchPaper', 'other'
    ];
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

    const fileUrl = `/public/uploads/${req.file.filename}`;

    // 1. Keep legacy fields in sync for backward compatibility
    if (!user.documents) {
      user.documents = {};
    }
    if (['resume', 'aadhaar', 'pan', 'marksheet'].includes(type)) {
      user.documents[type] = fileUrl;
    }
    if (type === 'transcript') {
      user.documents.marksheet = fileUrl; // sync transcript with marksheet
    }

    // 2. Save in the documents.list array
    if (!user.documents.list) {
      user.documents.list = [];
    }

    // Replace existing item of same type if present
    const existingIndex = user.documents.list.findIndex(item => item.type === type);
    if (existingIndex !== -1) {
      const oldItemUrl = user.documents.list[existingIndex].fileUrl;
      if (oldItemUrl) {
        const oldFilepath = path.join(__dirname, '..', '..', oldItemUrl);
        if (fs.existsSync(oldFilepath)) {
          try {
            fs.unlinkSync(oldFilepath);
          } catch (err) {}
        }
      }
      user.documents.list.splice(existingIndex, 1);
    }

    const defaultTitles = {
      resume: 'Resume / CV',
      aadhaar: 'Aadhaar Card',
      pan: 'PAN Card',
      marksheet: 'Marksheet',
      transcript: 'Academic Transcript',
      projectReport: 'Project Report',
      internshipOffer: 'Internship Offer Letter',
      internshipCompletion: 'Internship Completion Certificate',
      experienceLetter: 'Experience Letter',
      researchPaper: 'Research Paper',
      other: 'Other Document'
    };

    user.documents.list.push({
      title: title || defaultTitles[type] || 'Document',
      type,
      fileUrl,
      description: description || '',
      uploadedAt: new Date()
    });

    await user.save();

    // Log timeline event
    const { logTimelineEvent } = require('../utils/timelineLogger');
    await logTimelineEvent(
      req.user.id,
      'DOCUMENT',
      `Uploaded required document: ${type.toUpperCase()}`,
      description || '',
      { type }
    );

    // Re-evaluate intelligence
    const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');
    const updatedUser = await evaluateUserIntelligence(req.user.id);

    res.status(200).json({
      success: true,
      message: `${type.toUpperCase()} uploaded successfully`,
      data: { user: updatedUser || user }
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
 * @desc    Delete a required document
 * @route   DELETE /api/auth/document/:type
 * @access  Private (Student/User)
 */
const deleteProfileDocument = async (req, res, next) => {
  try {
    const { type } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // 1. Clear legacy fields
    if (user.documents) {
      if (['resume', 'aadhaar', 'pan', 'marksheet'].includes(type)) {
        user.documents[type] = '';
      }
      if (type === 'transcript') {
        user.documents.marksheet = '';
      }
    }

    // 2. Remove from documents.list array and delete file
    if (user.documents?.list) {
      const idx = user.documents.list.findIndex(item => item.type === type);
      if (idx !== -1) {
        const fileUrl = user.documents.list[idx].fileUrl;
        if (fileUrl) {
          const filepath = path.join(__dirname, '..', '..', fileUrl);
          if (fs.existsSync(filepath)) {
            try {
              fs.unlinkSync(filepath);
            } catch (err) {}
          }
        }
        user.documents.list.splice(idx, 1);
      }
    }

    await user.save();

    // Log timeline event
    const { logTimelineEvent } = require('../utils/timelineLogger');
    await logTimelineEvent(
      req.user.id,
      'DOCUMENT',
      `Deleted required document: ${type.toUpperCase()}`,
      '',
      { type }
    );

    // Re-evaluate intelligence
    const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');
    const updatedUser = await evaluateUserIntelligence(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      data: { user: updatedUser || user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get/Download/Preview profile document
 * @route   GET /api/auth/document/:type
 * @access  Private
 */
const getProfileDocument = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { download } = req.query;

    let targetUserId = req.user.id;
    if (req.query.userId && req.user.role !== 'user') {
      targetUserId = req.query.userId;
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (req.user.role === 'user' && targetUserId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (req.user.role !== 'admin' && req.user.id !== targetUserId) {
      if (req.user.university?.name && user.university?.name !== req.user.university.name) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    // Try finding the fileUrl from list first, fallback to legacy field
    let fileUrl = '';
    if (user.documents?.list) {
      const item = user.documents.list.find(d => d.type === type);
      if (item) fileUrl = item.fileUrl;
    }
    if (!fileUrl && user.documents) {
      fileUrl = user.documents[type];
    }

    if (!fileUrl) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const filepath = path.join(__dirname, '..', '..', fileUrl);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: 'Physical file is missing.' });
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

/**
 * @desc    Upload new certificate
 * @route   POST /api/auth/certificate
 * @access  Private (Student/User)
 */
const createCertificate = async (req, res, next) => {
  try {
    const { title, issuer, category, issueDate, expiryDate, credentialId, verificationUrl, description } = req.body;
    if (!title) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Certificate title is required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let fileUrl = '';
    if (req.file) {
      fileUrl = `/public/uploads/${req.file.filename}`;
    }

    const newCert = {
      title,
      issuer: issuer || '',
      category: category || '',
      date: issueDate ? new Date(issueDate) : null, // sync date with issueDate
      issueDate: issueDate ? new Date(issueDate) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      credentialId: credentialId || '',
      verificationUrl: verificationUrl || '',
      description: description || '',
      fileUrl,
      uploadedAt: new Date(),
      isVerified: false,
      verifiedBy: null
    };

    if (!user.certificates) {
      user.certificates = [];
    }
    user.certificates.push(newCert);
    await user.save();

    // Log timeline event
    const { logTimelineEvent } = require('../utils/timelineLogger');
    await logTimelineEvent(
      req.user.id,
      'CERTIFICATE',
      `Added Certificate: ${title}`,
      description || '',
      { title, issuer }
    );

    // Re-evaluate intelligence
    const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');
    const updatedUser = await evaluateUserIntelligence(req.user.id);

    res.status(201).json({
      success: true,
      message: 'Certificate uploaded successfully',
      data: { user: updatedUser || user }
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
 * @desc    Update certificate information
 * @route   PUT /api/auth/certificate/:id
 * @access  Private (Student/User)
 */
const updateCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, issuer, category, issueDate, expiryDate, credentialId, verificationUrl, description } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const certIndex = user.certificates.findIndex(c => c._id.toString() === id);
    if (certIndex === -1) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    const cert = user.certificates[certIndex];

    if (title) cert.title = title;
    if (issuer !== undefined) cert.issuer = issuer;
    if (category !== undefined) cert.category = category;
    if (issueDate !== undefined) {
      cert.issueDate = issueDate ? new Date(issueDate) : null;
      cert.date = issueDate ? new Date(issueDate) : null;
    }
    if (expiryDate !== undefined) cert.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (credentialId !== undefined) cert.credentialId = credentialId;
    if (verificationUrl !== undefined) cert.verificationUrl = verificationUrl;
    if (description !== undefined) cert.description = description;

    // If new file is uploaded, replace the old one
    if (req.file) {
      if (cert.fileUrl) {
        const oldFilepath = path.join(__dirname, '..', '..', cert.fileUrl);
        if (fs.existsSync(oldFilepath)) {
          try {
            fs.unlinkSync(oldFilepath);
          } catch (err) {}
        }
      }
      cert.fileUrl = `/public/uploads/${req.file.filename}`;
    }

    await user.save();

    // Log timeline event
    const { logTimelineEvent } = require('../utils/timelineLogger');
    await logTimelineEvent(
      req.user.id,
      'CERTIFICATE',
      `Updated Certificate: ${cert.title}`,
      cert.description || '',
      { title: cert.title, issuer: cert.issuer }
    );

    // Re-evaluate intelligence
    const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');
    const updatedUser = await evaluateUserIntelligence(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Certificate updated successfully',
      data: { user: updatedUser || user }
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
 * @desc    Delete certificate
 * @route   DELETE /api/auth/certificate/:id
 * @access  Private (Student/User)
 */
const deleteCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const certIndex = user.certificates.findIndex(c => c._id.toString() === id);
    if (certIndex === -1) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    const cert = user.certificates[certIndex];
    if (cert.fileUrl) {
      const filepath = path.join(__dirname, '..', '..', cert.fileUrl);
      if (fs.existsSync(filepath)) {
        try {
          fs.unlinkSync(filepath);
        } catch (err) {}
      }
    }

    const deletedTitle = cert.title;
    user.certificates.splice(certIndex, 1);
    await user.save();

    // Log timeline event
    const { logTimelineEvent } = require('../utils/timelineLogger');
    await logTimelineEvent(
      req.user.id,
      'CERTIFICATE',
      `Removed Certificate: ${deletedTitle}`,
      ''
    );

    // Re-evaluate intelligence
    const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');
    const updatedUser = await evaluateUserIntelligence(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Certificate deleted successfully',
      data: { user: updatedUser || user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get/Download/Preview certificate file
 * @route   GET /api/auth/certificate/:id/file
 * @access  Private
 */
const getCertificateFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { download } = req.query;

    let targetUserId = req.user.id;
    if (req.query.userId && req.user.role !== 'user') {
      targetUserId = req.query.userId;
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (req.user.role === 'user' && targetUserId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (req.user.role !== 'admin' && req.user.id !== targetUserId) {
      if (req.user.university?.name && user.university?.name !== req.user.university.name) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const cert = user.certificates.find(c => c._id.toString() === id);
    if (!cert || !cert.fileUrl) {
      return res.status(404).json({ success: false, message: 'Certificate file not found.' });
    }

    const filepath = path.join(__dirname, '..', '..', cert.fileUrl);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: 'Physical file is missing.' });
    }

    if (download === 'true') {
      res.download(filepath, `${cert.title.replace(/\s+/g, '_')}${path.extname(filepath)}`);
    } else {
      res.sendFile(filepath);
    }
  } catch (error) {
    next(error);
  }
};

// ─── Portfolio Documents (dynamic, unified) ──────────────────────────────────

/**
 * @desc    Create a new portfolio document
 * @route   POST /api/auth/portfolio-doc
 * @access  Private (Student/User)
 */
const createPortfolioDoc = async (req, res, next) => {
  try {
    const { title, category, description } = req.body;
    if (!title || !title.trim()) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Document title is required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const allowedCategories = ['Resume', 'Certificate', 'Marksheet', 'Project Report', 'Internship', 'Achievement', 'Research Paper', 'Other'];
    const safeCategory = allowedCategories.includes(category) ? category : 'Other';

    const newDoc = {
      title: title.trim(),
      category: safeCategory,
      description: description?.trim() || '',
      fileUrl: req.file ? `/public/uploads/${req.file.filename}` : '',
      originalName: req.file ? req.file.originalname : '',
      uploadedAt: new Date(),
    };

    if (!user.portfolioDocs) user.portfolioDocs = [];
    user.portfolioDocs.push(newDoc);
    await user.save();

    // Log timeline event
    const { logTimelineEvent } = require('../utils/timelineLogger');
    await logTimelineEvent(
      req.user.id,
      'DOCUMENT',
      `Uploaded ${safeCategory}: ${title}`,
      description?.substring(0, 50),
      { category: safeCategory }
    );

    // Re-evaluate intelligence asynchronously
    const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');
    evaluateUserIntelligence(req.user.id).catch(err => console.error('AI Eval Error:', err));

    res.status(201).json({ success: true, message: 'Document added successfully.', data: { user } });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    next(error);
  }
};

/**
 * @desc    Update a portfolio document (metadata and optionally file)
 * @route   PUT /api/auth/portfolio-doc/:id
 * @access  Private (Student/User)
 */
const updatePortfolioDoc = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, category, description } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const doc = (user.portfolioDocs || []).find(d => d._id.toString() === id);
    if (!doc) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const allowedCategories = ['Resume', 'Certificate', 'Marksheet', 'Project Report', 'Internship', 'Achievement', 'Research Paper', 'Other'];

    if (title?.trim()) doc.title = title.trim();
    if (category && allowedCategories.includes(category)) doc.category = category;
    if (description !== undefined) doc.description = description?.trim() || '';

    if (req.file) {
      // Delete old file
      if (doc.fileUrl) {
        const oldPath = path.join(__dirname, '..', '..', doc.fileUrl);
        if (fs.existsSync(oldPath)) { try { fs.unlinkSync(oldPath); } catch (_) {} }
      }
      doc.fileUrl = `/public/uploads/${req.file.filename}`;
      doc.originalName = req.file.originalname;
    }

    await user.save();

    // Log timeline event
    const { logTimelineEvent } = require('../utils/timelineLogger');
    await logTimelineEvent(
      req.user.id,
      'DOCUMENT',
      `Updated ${doc.category}: ${doc.title}`,
      doc.description || '',
      { category: doc.category }
    );

    // Re-evaluate intelligence
    const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');
    const updatedUser = await evaluateUserIntelligence(req.user.id);

    res.status(200).json({ success: true, message: 'Document updated successfully.', data: { user: updatedUser || user } });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    next(error);
  }
};

/**
 * @desc    Delete a portfolio document
 * @route   DELETE /api/auth/portfolio-doc/:id
 * @access  Private (Student/User)
 */
const deletePortfolioDoc = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const idx = (user.portfolioDocs || []).findIndex(d => d._id.toString() === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Document not found.' });

    const doc = user.portfolioDocs[idx];
    if (doc.fileUrl) {
      const filepath = path.join(__dirname, '..', '..', doc.fileUrl);
      if (fs.existsSync(filepath)) { try { fs.unlinkSync(filepath); } catch (_) {} }
    }

    const deletedTitle = doc.title;
    const deletedCat = doc.category;
    user.portfolioDocs.splice(idx, 1);
    await user.save();

    // Log timeline event
    const { logTimelineEvent } = require('../utils/timelineLogger');
    await logTimelineEvent(
      req.user.id,
      'DOCUMENT',
      `Deleted ${deletedCat}: ${deletedTitle}`,
      ''
    );

    // Re-evaluate intelligence
    const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');
    const updatedUser = await evaluateUserIntelligence(req.user.id);

    res.status(200).json({ success: true, message: 'Document deleted successfully.', data: { user: updatedUser || user } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download or preview a portfolio document file
 * @route   GET /api/auth/portfolio-doc/:id/file
 * @access  Private
 */
const getPortfolioDocFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { download } = req.query;

    let targetUserId = req.user.id;
    if (req.query.userId && req.user.role !== 'user') {
      targetUserId = req.query.userId;
    }

    const user = await User.findById(targetUserId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (req.user.role === 'user' && targetUserId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (req.user.role !== 'admin' && req.user.id !== targetUserId) {
      if (req.user.university?.name && user.university?.name !== req.user.university.name) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const doc = (user.portfolioDocs || []).find(d => d._id.toString() === id);
    if (!doc || !doc.fileUrl) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const filepath = path.join(__dirname, '..', '..', doc.fileUrl);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: 'Physical file is missing.' });
    }

    if (download === 'true') {
      res.download(filepath, `${doc.title.replace(/\s+/g, '_')}${path.extname(filepath)}`);
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
  deleteProfileDocument,
  getProfileDocument,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  getCertificateFile,
  createPortfolioDoc,
  updatePortfolioDoc,
  deletePortfolioDoc,
  getPortfolioDocFile,
};
