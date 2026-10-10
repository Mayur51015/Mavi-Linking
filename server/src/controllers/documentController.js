const multer = require('multer');
const path = require('path');
const fs = require('fs');
const SharedDocument = require('../models/SharedDocument');
const { ingestionQueue } = require('../workers/queue');
const {
  STORAGE_BUCKETS,
  validateFile,
  generateStoragePath,
} = require('../utils/fileValidation');
const {
  uploadFile,
  getSignedUrl,
  deleteFile,
  cleanupOrphan,
} = require('../services/supabaseStorageService');

// Multer Memory Storage Configuration (avoids ephemeral disk writes on Render)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

/**
 * @desc    Upload a new shared document
 * @route   POST /api/documents
 * @access  Private (Teacher, Admin)
 */
const uploadDocument = async (req, res, next) => {
  let uploadedStoragePath = null;
  const bucket = STORAGE_BUCKETS.INSTITUTION_DOCUMENTS;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded or file rejected by validator.' });
    }

    const { title, description, department } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Document title is required.' });
    }

    // Validate file with bucket policy
    const validation = validateFile(req.file, bucket);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    let targetDept = department || '';
    if (req.user.role !== 'admin' && req.user.university?.department) {
      const allowedDepts = req.user.university.department.split(',').map(d => d.trim()).filter(Boolean);
      if (targetDept && targetDept !== 'All' && !allowedDepts.includes(targetDept)) {
        return res.status(400).json({
          success: false,
          message: `Invalid department. Allowed departments: ${allowedDepts.join(', ')}`,
        });
      }
      if (!targetDept) {
        targetDept = allowedDepts[0] || 'All';
      }
    } else if (!targetDept) {
      targetDept = 'All';
    }

    // Upload to Supabase Storage
    uploadedStoragePath = generateStoragePath('shared-docs', req.user.id, req.file.originalname);

    const uploadResult = await uploadFile({
      bucket,
      objectPath: uploadedStoragePath,
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
    });

    if (!uploadResult.success) {
      return res.status(502).json({
        success: false,
        message: `Failed to upload document to storage: ${uploadResult.error}`,
      });
    }

    let userCollege = req.user.university?.name || '';
    if (!userCollege && req.user.institutionId) {
      const Institution = require('../models/Institution');
      const inst = await Institution.findById(req.user.institutionId).select('name');
      if (inst) userCollege = inst.name;
    }

    const doc = await SharedDocument.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      fileName: req.file.originalname,
      fileUrl: uploadedStoragePath,
      storagePath: uploadedStoragePath,
      bucket,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.id,
      college: userCollege,
      department: targetDept,
    });


    // Enqueue document for background vector embedding generation
    try {
      if (ingestionQueue && ingestionQueue.add) {
        await ingestionQueue.add('vector-ingestion', { documentId: doc._id });
      }
    } catch (_) {}

    res.status(202).json({
      success: true,
      data: doc,
      message: 'Document uploaded and queued for processing.',
    });
  } catch (error) {
    if (uploadedStoragePath) {
      await cleanupOrphan({ bucket, objectPath: uploadedStoragePath });
    }
    next(error);
  }
};

/**
 * @desc    Get shared documents with pagination, search, and filters
 * @route   GET /api/documents
 * @access  Private (Student, Teacher, Admin)
 */
const getDocuments = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10, departmentFilter } = req.query;
    const userRole = req.user.role;
    const college = req.user.university?.name || '';
    const department = req.user.university?.department || '';

    const query = {};

    // Scoping check: Students and Teachers only see files from their own college
    if (userRole !== 'admin' && college) {
      query.college = college;
    }

    // Filter by department
    if (userRole === 'teacher') {
      const teacherDepts = department.split(',').map(d => d.trim()).filter(Boolean);
      if (departmentFilter) {
        query.department = departmentFilter;
      } else {
        query.department = { $in: [...teacherDepts, 'All', ''] };
      }
    } else if (userRole === 'user') {
      if (departmentFilter) {
        query.department = departmentFilter;
      } else {
        query.department = { $in: [department, 'All', ''] };
      }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { fileName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await SharedDocument.countDocuments(query);

    const docs = await SharedDocument.find(query)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: docs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update document metadata details
 * @route   PUT /api/documents/:id
 * @access  Private (Teacher, Admin)
 */
const updateDocument = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    const doc = await SharedDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (req.user.role !== 'admin' && doc.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only edit your own uploads.' });
    }

    if (title) doc.title = title.trim();
    if (description !== undefined) doc.description = description.trim();

    await doc.save();
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a shared document
 * @route   DELETE /api/documents/:id
 * @access  Private (Teacher, Admin)
 */
const deleteDocument = async (req, res, next) => {
  try {
    const doc = await SharedDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (req.user.role !== 'admin' && doc.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only delete your own uploads.' });
    }

    // 1. Delete from Supabase Storage
    if (doc.storagePath) {
      await deleteFile(doc.bucket || STORAGE_BUCKETS.INSTITUTION_DOCUMENTS, doc.storagePath);
    } else if (doc.fileUrl && !doc.fileUrl.startsWith('data:')) {
      const filename = path.basename(doc.fileUrl);
      const filepath = path.join(process.cwd(), 'uploads', filename);
      if (fs.existsSync(filepath)) {
        try { fs.unlinkSync(filepath); } catch (_) {}
      }
    }

    await SharedDocument.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Securely download a document (checking if user belongs to same college)
 * @route   GET /api/documents/:id/download
 * @access  Private
 */
const downloadDocument = async (req, res, next) => {
  try {
    const doc = await SharedDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    let userCollege = req.user.university?.name || '';
    if (!userCollege && req.user.institutionId) {
      const Institution = require('../models/Institution');
      const inst = await Institution.findById(req.user.institutionId).select('name');
      if (inst) userCollege = inst.name;
    }

    // Scope check: must share same college
    if (req.user.role !== 'admin' && doc.college && userCollege && userCollege !== doc.college) {
      return res.status(403).json({ success: false, message: 'Access denied. This document belongs to another college.' });
    }


    // 1. Supabase Storage flow
    if (doc.storagePath) {
      const signedUrl = await getSignedUrl(doc.bucket || STORAGE_BUCKETS.INSTITUTION_DOCUMENTS, doc.storagePath, 3600);
      if (signedUrl) {
        if (req.query.format === 'json') {
          return res.status(200).json({ success: true, url: signedUrl, download: true });
        }
        return res.redirect(signedUrl);
      }
    }

    // 2. Base64 fallback
    if (doc.fileUrl && doc.fileUrl.startsWith('data:')) {
      const matches = doc.fileUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName || 'document.pdf'}"`);
        return res.send(buffer);
      }
    }

    // 3. Disk fallback
    const filename = path.basename(doc.fileUrl || '');
    const candidatePaths = [
      path.join(process.cwd(), 'uploads', filename),
      path.join(__dirname, '..', '..', 'uploads', filename),
    ];
    const filepath = candidatePaths.find(p => fs.existsSync(p));

    if (filepath) {
      return res.download(filepath, doc.fileName);
    }

    return res.status(404).json({ success: false, message: 'Document file is no longer available.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  uploadDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  downloadDocument,
};
