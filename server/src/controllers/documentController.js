const multer = require('multer');
const path = require('path');
const fs = require('fs');
const SharedDocument = require('../models/SharedDocument');
const { buildSearchFilter, parsePagination, totalPages } = require('../utils/queryHelpers');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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
      // Clean up uploaded file if validation fails
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Document title is required.' });
    }

    let targetDept = department || '';
    if (req.user.role !== 'admin' && req.user.university?.department) {
      const allowedDepts = req.user.university.department.split(',').map(d => d.trim()).filter(Boolean);
      if (targetDept && targetDept !== 'All' && !allowedDepts.includes(targetDept)) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
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

    const doc = await SharedDocument.create({
      title,
      description: description || '',
      fileName: req.file.originalname,
      fileUrl: `/public/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.id,
      college: req.user.university?.name || '',
      department: targetDept,
    });

    res.status(201).json({ success: true, data: doc });
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
    const { search, departmentFilter } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
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

    // Search query — the term is escaped, so it can't widen the department and
    // college scoping applied above or be used as a backtracking bomb.
    const searchFilter = buildSearchFilter(search, ['title', 'description', 'fileName']);
    if (searchFilter) {
      Object.assign(query, searchFilter);
    }

    const total = await SharedDocument.countDocuments(query);

    const docs = await SharedDocument.find(query)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: docs,
      pagination: {
        total,
        page,
        limit,
        pages: totalPages(total, limit),
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
