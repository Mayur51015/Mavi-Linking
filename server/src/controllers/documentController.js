const multer = require('multer');
const path = require('path');
const SharedDocument = require('../models/SharedDocument');
const { ingestionQueue } = require('../workers/queue');

// Multer Memory Storage Configuration (stores file in memory buffer, avoiding local disk writes)
const storage = multer.memoryStorage();

// File Type Validation filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.zip', '.xls', '.xlsx', '.ppt', '.pptx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed extensions: ${allowedExtensions.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

/**
 * @desc    Upload a new shared document
 * @route   POST /api/documents
 * @access  Private (Teacher, Admin)
 */
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded or file rejected by validator.' });
    }

    const { title, description, department } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Document title is required.' });
    }

    let targetDept = department || '';
    if (req.user.role !== 'admin' && req.user.university?.department) {
      const allowedDepts = req.user.university.department.split(',').map(d => d.trim()).filter(Boolean);
      if (targetDept && targetDept !== 'All' && !allowedDepts.includes(targetDept)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid department. Allowed departments: ${allowedDepts.join(', ')}` 
        });
      }
      if (!targetDept) {
        targetDept = allowedDepts[0] || 'All';
      }
    } else if (!targetDept) {
      targetDept = 'All';
    }

    // Convert buffer to Data URL for database storage
    const mimeType = req.file.mimetype || 'application/octet-stream';
    const base64Data = req.file.buffer.toString('base64');
    const fileUrl = `data:${mimeType};base64,${base64Data}`;

    const doc = await SharedDocument.create({
      title,
      description: description || '',
      fileName: req.file.originalname,
      fileUrl,
      fileSize: req.file.size,
      mimeType,
      uploadedBy: req.user.id,
      college: req.user.university?.name || '',
      department: targetDept,
    });

    // Enqueue document for background vector embedding generation
    await ingestionQueue.add('vector-ingestion', { documentId: doc._id });

    res.status(202).json({ success: true, data: doc, message: 'Document uploaded and queued for processing.' });
  } catch (error) {
    // If multer threw an error or database insertion failed, cleanup file
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {}
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
        const studentDept = department;
        if (studentDept) {
          query.department = { $in: [studentDept, 'All', ''] };
        }
      }
    }

    // Search query
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
        pages: Math.ceil(total / limit),
      }
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
    
    // Check permission: only admin or the teacher who uploaded the doc can update it
    const doc = await SharedDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (req.user.role !== 'admin' && doc.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only edit your own uploads.' });
    }

    if (title) doc.title = title;
    if (description !== undefined) doc.description = description;

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

    // Permission check
    if (req.user.role !== 'admin' && doc.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only delete your own uploads.' });
    }

    // Delete file from filesystem
    const filename = path.basename(doc.fileUrl);
    const filepath = path.join(uploadDir, filename);
    if (fs.existsSync(filepath)) {
      try {
        fs.unlinkSync(filepath);
      } catch (err) {
        console.error('Failed to delete physical file:', err.message);
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

    // Scope check: must share same college
    if (req.user.role !== 'admin' && doc.college && req.user.university?.name !== doc.college) {
      return res.status(403).json({ success: false, message: 'Access denied. This document belongs to another college.' });
    }

    const filename = path.basename(doc.fileUrl);
    const filepath = path.join(uploadDir, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: 'Physical file is missing from disk storage.' });
    }

    res.download(filepath, doc.fileName);
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
