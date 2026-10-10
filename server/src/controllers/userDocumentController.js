const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const User = require('../models/User');
const {
  STORAGE_BUCKETS,
  validateFile,
  generateStoragePath,
} = require('../utils/fileValidation');
const {
  uploadFile,
  getSignedUrl,
  getPublicUrl,
  deleteFile,
  replaceFile,
  cleanupOrphan,
} = require('../services/supabaseStorageService');

// Multer in-memory storage config (prevents ephemeral disk leaks on Render)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB absolute ceiling; bucket-specific limits enforced in validation
});

/**
 * Determine default bucket for document type
 */
const getBucketForDocType = (type) => {
  if (type === 'resume') {
    return STORAGE_BUCKETS.RESUMES;
  }
  if (['transcript', 'marksheet', 'certificate', 'internshipCompletion'].includes(type)) {
    return STORAGE_BUCKETS.CERTIFICATES;
  }
  return STORAGE_BUCKETS.INSTITUTION_DOCUMENTS;
};

/**
 * Determine bucket for portfolio doc category
 */
const getBucketForPortfolioCategory = (category) => {
  if (category === 'Resume') {
    return STORAGE_BUCKETS.RESUMES;
  }
  if (category === 'Certificate' || category === 'Marksheet') {
    return STORAGE_BUCKETS.CERTIFICATES;
  }
  return STORAGE_BUCKETS.PROJECT_ASSETS;
};

/**
 * @desc    Upload profile document (resume, transcript, projectReport, internshipOffer, etc.)
 * @route   POST /api/auth/document/:type
 * @access  Private (Student/User)
 */
const uploadProfileDocument = async (req, res, next) => {
  let uploadedStoragePath = null;
  let targetBucket = null;

  try {
    const { type } = req.params;
    const { title, description } = req.body;
    const allowedTypes = [
      'resume', 'aadhaar', 'pan', 'marksheet',
      'transcript', 'projectReport', 'internshipOffer', 'internshipCompletion', 'experienceLetter', 'researchPaper', 'other'
    ];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid document type.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded or file rejected by validator.' });
    }

    targetBucket = getBucketForDocType(type);

    // Validate file extension, MIME type, size, and magic bytes
    const validation = validateFile(req.file, targetBucket);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Generate secure storage path
    uploadedStoragePath = generateStoragePath(type, req.user.id, req.file.originalname);

    // Check for previous storage path to replace
    let oldStoragePath = null;
    let oldBucket = targetBucket;
    if (user.documents?.list) {
      const existing = user.documents.list.find(item => item.type === type);
      if (existing?.storagePath) {
        oldStoragePath = existing.storagePath;
        oldBucket = existing.bucket || targetBucket;
      }
    }

    // Upload to Supabase Storage
    const uploadResult = await uploadFile({
      bucket: targetBucket,
      objectPath: uploadedStoragePath,
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
    });

    if (!uploadResult.success) {
      return res.status(502).json({
        success: false,
        message: `Failed to upload file to storage: ${uploadResult.error}`,
      });
    }

    // Clean up old file if replacing
    if (oldStoragePath && oldStoragePath !== uploadedStoragePath) {
      await deleteFile(oldBucket, oldStoragePath);
    }

    const fileUrl = uploadedStoragePath;

    // 1. Keep legacy fields in sync for backward compatibility
    if (!user.documents) {
      user.documents = {};
    }
    if (['resume', 'aadhaar', 'pan', 'marksheet'].includes(type)) {
      user.documents[type] = fileUrl;
    }
    if (type === 'transcript') {
      user.documents.marksheet = fileUrl;
    }

    // 2. Save in documents.list array with Supabase metadata
    if (!user.documents.list) {
      user.documents.list = [];
    }

    const existingIndex = user.documents.list.findIndex(item => item.type === type);
    if (existingIndex !== -1) {
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
      storagePath: uploadedStoragePath,
      bucket: targetBucket,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      description: description || '',
      uploadedAt: new Date(),
    });

    await user.save();

    // Log timeline event
    try {
      const { logTimelineEvent } = require('../utils/timelineLogger');
      await logTimelineEvent(
        req.user.id,
        'DOCUMENT',
        `Uploaded required document: ${type.toUpperCase()}`,
        description || '',
        { type }
      );
    } catch (_) {}

    // Re-evaluate intelligence
    try {
      const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');
      await evaluateUserIntelligence(req.user.id);
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: `${type.toUpperCase()} uploaded successfully`,
      data: {
        user,
        storagePath: uploadedStoragePath,
        bucket: targetBucket,
      },
    });
  } catch (error) {
    if (uploadedStoragePath && targetBucket) {
      await cleanupOrphan({ bucket: targetBucket, objectPath: uploadedStoragePath });
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

    // 2. Remove from documents.list array and delete from Supabase/disk
    if (user.documents?.list) {
      const idx = user.documents.list.findIndex(item => item.type === type);
      if (idx !== -1) {
        const item = user.documents.list[idx];
        if (item.storagePath) {
          await deleteFile(item.bucket || getBucketForDocType(type), item.storagePath);
        } else if (item.fileUrl && !item.fileUrl.startsWith('data:')) {
          const filepath = path.join(__dirname, '..', '..', item.fileUrl);
          if (fs.existsSync(filepath)) {
            try { fs.unlinkSync(filepath); } catch (_) {}
          }
        }
        user.documents.list.splice(idx, 1);
      }
    }

    await user.save();

    // Log timeline event
    try {
      const { logTimelineEvent } = require('../utils/timelineLogger');
      await logTimelineEvent(
        req.user.id,
        'DOCUMENT',
        `Deleted required document: ${type.toUpperCase()}`,
        '',
        { type }
      );
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      data: { user },
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
    const { download, format } = req.query;

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

    let docItem = null;
    if (user.documents?.list) {
      docItem = user.documents.list.find(d => d.type === type);
    }

    const rawFileUrl = docItem?.fileUrl || user.documents?.[type];
    const storagePath = docItem?.storagePath;
    const bucket = docItem?.bucket || getBucketForDocType(type);

    if (!storagePath && !rawFileUrl) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // 1. Supabase Storage flow
    if (storagePath) {
      const signedUrl = await getSignedUrl(bucket, storagePath, 3600);
      if (signedUrl) {
        if (format === 'json' || req.query.signedUrl === 'true') {
          return res.status(200).json({ success: true, url: signedUrl, data: { signedUrl }, download: download === 'true' });
        }
        return res.redirect(signedUrl);
      }
    }

    // 2. Base64 Data URL fallback
    if (rawFileUrl && rawFileUrl.startsWith('data:')) {
      const matches = rawFileUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        res.setHeader('Content-Type', mime);
        const disposition = download === 'true' ? 'attachment' : 'inline';
        res.setHeader('Content-Disposition', `${disposition}; filename="${type}-${user.name.replace(/\s+/g, '_')}.pdf"`);
        return res.send(buffer);
      }
    }

    // 3. Local disk fallback
    const filepath = path.join(__dirname, '..', '..', rawFileUrl);
    if (fs.existsSync(filepath)) {
      if (download === 'true') {
        return res.download(filepath, `${type}-${user.name.replace(/\s+/g, '_')}${path.extname(filepath)}`);
      }
      return res.sendFile(filepath);
    }

    return res.status(404).json({ success: false, message: 'Document file is no longer available.' });
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
  let uploadedStoragePath = null;
  const bucket = STORAGE_BUCKETS.CERTIFICATES;

  try {
    const { title, issuer, category, issueDate, expiryDate, credentialId, verificationUrl, description } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Certificate title is required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let fileUrl = '';
    let originalName = '';
    let mimeType = '';
    let fileSize = 0;

    if (req.file) {
      const validation = validateFile(req.file, bucket);
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.message });
      }

      uploadedStoragePath = generateStoragePath('certificates', req.user.id, req.file.originalname);
      originalName = req.file.originalname;
      mimeType = req.file.mimetype;
      fileSize = req.file.size;

      const uploadResult = await uploadFile({
        bucket,
        objectPath: uploadedStoragePath,
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
      });

      if (!uploadResult.success) {
        return res.status(502).json({
          success: false,
          message: `Failed to upload certificate file: ${uploadResult.error}`,
        });
      }

      fileUrl = uploadedStoragePath;
    }

    const newCert = {
      title: title.trim(),
      issuer: issuer ? issuer.trim() : '',
      category: category ? category.trim() : '',
      date: issueDate ? new Date(issueDate) : null,
      issueDate: issueDate ? new Date(issueDate) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      credentialId: credentialId ? credentialId.trim() : '',
      verificationUrl: verificationUrl ? verificationUrl.trim() : '',
      description: description ? description.trim() : '',
      fileUrl,
      storagePath: uploadedStoragePath || '',
      bucket,
      originalName,
      mimeType,
      fileSize,
      uploadedAt: new Date(),
      isVerified: false,
      verifiedBy: null,
    };

    if (!user.certificates) {
      user.certificates = [];
    }
    user.certificates.push(newCert);
    await user.save();

    // Log timeline event
    try {
      const { logTimelineEvent } = require('../utils/timelineLogger');
      await logTimelineEvent(
        req.user.id,
        'CERTIFICATE',
        `Added Certificate: ${title}`,
        description || '',
        { title, issuer }
      );
    } catch (_) {}

    const createdCert = user.certificates[user.certificates.length - 1];
    res.status(201).json({
      success: true,
      message: 'Certificate uploaded successfully',
      data: { user, certificate: createdCert },
    });
  } catch (error) {
    if (uploadedStoragePath) {
      await cleanupOrphan({ bucket, objectPath: uploadedStoragePath });
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
  let uploadedStoragePath = null;
  const bucket = STORAGE_BUCKETS.CERTIFICATES;

  try {
    const { id } = req.params;
    const { title, issuer, category, issueDate, expiryDate, credentialId, verificationUrl, description } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const certIndex = (user.certificates || []).findIndex(c => c._id.toString() === id);
    if (certIndex === -1) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    const cert = user.certificates[certIndex];

    if (title) cert.title = title.trim();
    if (issuer !== undefined) cert.issuer = issuer.trim();
    if (category !== undefined) cert.category = category.trim();
    if (issueDate !== undefined) {
      cert.issueDate = issueDate ? new Date(issueDate) : null;
      cert.date = issueDate ? new Date(issueDate) : null;
    }
    if (expiryDate !== undefined) cert.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (credentialId !== undefined) cert.credentialId = credentialId.trim();
    if (verificationUrl !== undefined) cert.verificationUrl = verificationUrl.trim();
    if (description !== undefined) cert.description = description.trim();

    if (req.file) {
      const validation = validateFile(req.file, bucket);
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.message });
      }

      uploadedStoragePath = generateStoragePath('certificates', req.user.id, req.file.originalname);

      // Safe replacement
      const oldStoragePath = cert.storagePath;
      const uploadResult = await replaceFile({
        bucket,
        oldPath: oldStoragePath,
        newPath: uploadedStoragePath,
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
      });

      if (!uploadResult.success) {
        return res.status(502).json({
          success: false,
          message: `Failed to replace certificate file: ${uploadResult.error}`,
        });
      }

      cert.fileUrl = uploadedStoragePath;
      cert.storagePath = uploadedStoragePath;
      cert.bucket = bucket;
      cert.originalName = req.file.originalname;
      cert.mimeType = req.file.mimetype;
      cert.fileSize = req.file.size;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Certificate updated successfully',
      data: { user },
    });
  } catch (error) {
    if (uploadedStoragePath) {
      await cleanupOrphan({ bucket, objectPath: uploadedStoragePath });
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

    const certIndex = (user.certificates || []).findIndex(c => c._id.toString() === id);
    if (certIndex === -1) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    const cert = user.certificates[certIndex];
    if (cert.storagePath) {
      await deleteFile(cert.bucket || STORAGE_BUCKETS.CERTIFICATES, cert.storagePath);
    } else if (cert.fileUrl && !cert.fileUrl.startsWith('data:')) {
      const filepath = path.join(__dirname, '..', '..', cert.fileUrl);
      if (fs.existsSync(filepath)) {
        try { fs.unlinkSync(filepath); } catch (_) {}
      }
    }

    user.certificates.splice(certIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Certificate deleted successfully',
      data: { user },
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
    const { download, format } = req.query;

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

    const cert = (user.certificates || []).find(c => c._id.toString() === id);
    if (!cert || (!cert.storagePath && !cert.fileUrl)) {
      return res.status(404).json({ success: false, message: 'Certificate file not found.' });
    }

    if (cert.storagePath) {
      const signedUrl = await getSignedUrl(cert.bucket || STORAGE_BUCKETS.CERTIFICATES, cert.storagePath, 3600);
      if (signedUrl) {
        if (format === 'json' || req.query.signedUrl === 'true') {
          return res.status(200).json({ success: true, url: signedUrl, data: { signedUrl }, download: download === 'true' });
        }
        return res.redirect(signedUrl);
      }
    }

    const filepath = path.join(__dirname, '..', '..', cert.fileUrl);
    if (fs.existsSync(filepath)) {
      if (download === 'true') {
        return res.download(filepath, `${cert.title.replace(/\s+/g, '_')}${path.extname(filepath)}`);
      }
      return res.sendFile(filepath);
    }

    return res.status(404).json({ success: false, message: 'Certificate file is no longer available.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new portfolio document
 * @route   POST /api/auth/portfolio-doc
 * @access  Private (Student/User)
 */
const createPortfolioDoc = async (req, res, next) => {
  let uploadedStoragePath = null;
  let bucket = STORAGE_BUCKETS.PROJECT_ASSETS;

  try {
    const { title, category, description } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Document title is required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const allowedCategories = ['Resume', 'Certificate', 'Marksheet', 'Project Report', 'Internship', 'Achievement', 'Research Paper', 'Other'];
    const safeCategory = allowedCategories.includes(category) ? category : 'Other';
    bucket = getBucketForPortfolioCategory(safeCategory);

    let originalName = '';
    let mimeType = '';
    let fileSize = 0;

    if (req.file) {
      const validation = validateFile(req.file, bucket);
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.message });
      }

      uploadedStoragePath = generateStoragePath('portfolio', req.user.id, req.file.originalname);
      originalName = req.file.originalname;
      mimeType = req.file.mimetype;
      fileSize = req.file.size;

      const uploadResult = await uploadFile({
        bucket,
        objectPath: uploadedStoragePath,
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
      });

      if (!uploadResult.success) {
        return res.status(502).json({
          success: false,
          message: `Failed to upload portfolio document: ${uploadResult.error}`,
        });
      }
    }

    const newDoc = {
      title: title.trim(),
      category: safeCategory,
      description: description?.trim() || '',
      fileUrl: uploadedStoragePath || '',
      storagePath: uploadedStoragePath || '',
      bucket,
      originalName,
      mimeType,
      fileSize,
      uploadedAt: new Date(),
    };

    if (!user.portfolioDocs) user.portfolioDocs = [];
    user.portfolioDocs.push(newDoc);
    await user.save();

    res.status(201).json({ success: true, message: 'Document added successfully.', data: { user } });
  } catch (error) {
    if (uploadedStoragePath) {
      await cleanupOrphan({ bucket, objectPath: uploadedStoragePath });
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
  let uploadedStoragePath = null;
  let bucket = STORAGE_BUCKETS.PROJECT_ASSETS;

  try {
    const { id } = req.params;
    const { title, category, description } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const doc = (user.portfolioDocs || []).find(d => d._id.toString() === id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const allowedCategories = ['Resume', 'Certificate', 'Marksheet', 'Project Report', 'Internship', 'Achievement', 'Research Paper', 'Other'];
    if (title?.trim()) doc.title = title.trim();
    if (category && allowedCategories.includes(category)) doc.category = category;
    if (description !== undefined) doc.description = description?.trim() || '';

    bucket = getBucketForPortfolioCategory(doc.category);

    if (req.file) {
      const validation = validateFile(req.file, bucket);
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.message });
      }

      uploadedStoragePath = generateStoragePath('portfolio', req.user.id, req.file.originalname);

      const oldPath = doc.storagePath;
      const uploadResult = await replaceFile({
        bucket,
        oldPath,
        newPath: uploadedStoragePath,
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
      });

      if (!uploadResult.success) {
        return res.status(502).json({
          success: false,
          message: `Failed to replace document: ${uploadResult.error}`,
        });
      }

      doc.fileUrl = uploadedStoragePath;
      doc.storagePath = uploadedStoragePath;
      doc.bucket = bucket;
      doc.originalName = req.file.originalname;
      doc.mimeType = req.file.mimetype;
      doc.fileSize = req.file.size;
    }

    await user.save();

    res.status(200).json({ success: true, message: 'Document updated successfully.', data: { user } });
  } catch (error) {
    if (uploadedStoragePath) {
      await cleanupOrphan({ bucket, objectPath: uploadedStoragePath });
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
    if (doc.storagePath) {
      await deleteFile(doc.bucket || STORAGE_BUCKETS.PROJECT_ASSETS, doc.storagePath);
    } else if (doc.fileUrl && !doc.fileUrl.startsWith('data:')) {
      const filepath = path.join(__dirname, '..', '..', doc.fileUrl);
      if (fs.existsSync(filepath)) { try { fs.unlinkSync(filepath); } catch (_) {} }
    }

    user.portfolioDocs.splice(idx, 1);
    await user.save();

    res.status(200).json({ success: true, message: 'Document deleted successfully.', data: { user } });
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
    const { download, format } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, code: 'INVALID_DOCUMENT_ID', message: 'Invalid document ID format.' });
    }

    let targetUserId = req.user.id;
    if (req.query.userId && req.user.role !== 'user') {
      targetUserId = req.query.userId;
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found.' });
    }

    if (req.user.role === 'user' && targetUserId !== req.user.id) {
      return res.status(403).json({ success: false, code: 'DOCUMENT_ACCESS_DENIED', message: 'You are not authorized to access this document.' });
    }

    if (req.user.role !== 'admin' && req.user.id !== targetUserId) {
      if (req.user.university?.name && user.university?.name !== req.user.university.name) {
        return res.status(403).json({ success: false, code: 'DOCUMENT_ACCESS_DENIED', message: 'You are not authorized to access this document.' });
      }
    }

    let doc = (user.portfolioDocs || []).find(d => d._id && d._id.toString() === id);

    if (!doc && user.certificates) {
      const cert = user.certificates.find(c => c._id && c._id.toString() === id);
      if (cert) doc = cert;
    }

    if (!doc && user.documents?.list) {
      const dList = user.documents.list.find(d => d._id && d._id.toString() === id);
      if (dList) doc = dList;
    }

    if (!doc || (!doc.storagePath && !doc.fileUrl)) {
      return res.status(404).json({ success: false, code: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' });
    }

    // 1. Supabase Storage flow
    if (doc.storagePath) {
      const bucket = doc.bucket || getBucketForPortfolioCategory(doc.category);
      const signedUrl = await getSignedUrl(bucket, doc.storagePath, 3600);
      if (signedUrl) {
        if (format === 'json') {
          return res.status(200).json({ success: true, url: signedUrl, download: download === 'true' });
        }
        return res.redirect(signedUrl);
      }
    }

    // 2. Base64 fallback
    const rawFileUrl = doc.fileUrl;
    if (rawFileUrl && rawFileUrl.startsWith('data:')) {
      const matches = rawFileUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        res.setHeader('Content-Type', mime);
        const disposition = download === 'true' ? 'attachment' : 'inline';
        res.setHeader('Content-Disposition', `${disposition}; filename="${(doc.title || 'document').replace(/\s+/g, '_')}.pdf"`);
        return res.send(buffer);
      }
    }

    // 3. Local disk fallback
    const candidatePaths = [
      path.join(__dirname, '..', '..', rawFileUrl.replace(/^[\/\\]+/, '')),
      path.join(__dirname, '..', '..', 'public', 'uploads', path.basename(rawFileUrl)),
      path.join(process.cwd(), rawFileUrl.replace(/^[\/\\]+/, '')),
      path.resolve(rawFileUrl),
    ];

    const filepath = candidatePaths.find(p => fs.existsSync(p));
    if (filepath) {
      const safeName = (doc.title || doc.originalName || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeName}${path.extname(filepath)}`;
      if (download === 'true') {
        return res.download(filepath, filename);
      }
      return res.sendFile(filepath);
    }

    return res.status(404).json({ success: false, code: 'FILE_NOT_FOUND', message: 'The document file is no longer available.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload avatar profile picture (Students, Faculty, Recruiters)
 * @route   POST /api/auth/avatar
 * @access  Private
 */
const uploadAvatar = async (req, res, next) => {
  let uploadedStoragePath = null;
  const bucket = STORAGE_BUCKETS.PROFILE_IMAGES;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
    }

    const validation = validateFile(req.file, bucket);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    uploadedStoragePath = generateStoragePath('avatars', req.user.id, req.file.originalname);

    const oldStoragePath = user.avatarStoragePath;
    const uploadResult = await replaceFile({
      bucket,
      oldPath: oldStoragePath,
      newPath: uploadedStoragePath,
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
    });

    if (!uploadResult.success) {
      return res.status(502).json({
        success: false,
        message: `Failed to upload avatar to storage: ${uploadResult.error}`,
      });
    }

    const publicUrl = getPublicUrl(bucket, uploadedStoragePath);
    user.avatar = publicUrl;
    user.avatarStoragePath = uploadedStoragePath;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully.',
      data: {
        avatar: publicUrl,
        user,
      },
    });
  } catch (error) {
    if (uploadedStoragePath) {
      await cleanupOrphan({ bucket, objectPath: uploadedStoragePath });
    }
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
  uploadAvatar,
};
