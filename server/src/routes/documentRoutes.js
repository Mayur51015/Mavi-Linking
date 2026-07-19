const express = require('express');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  upload,
  uploadDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  downloadDocument,
} = require('../controllers/documentController');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getDocuments)
  .post(requireRole('teacher', 'admin'), upload.single('file'), uploadDocument);

router.route('/:id')
  .put(requireRole('teacher', 'admin'), updateDocument)
  .delete(requireRole('teacher', 'admin'), deleteDocument);

router.get('/:id/download', downloadDocument);

module.exports = router;
