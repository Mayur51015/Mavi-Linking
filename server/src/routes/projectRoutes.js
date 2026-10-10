const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createProject,
  getMyProjects,
  updateProject,
  deleteProject,
  uploadProjectScreenshot,
} = require('../controllers/projectController');
const { uploadScreenshot } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createProject)
  .get(protect, getMyProjects);

router.route('/:id')
  .put(protect, updateProject)
  .delete(protect, deleteProject);

router.post('/:id/screenshot', protect, uploadScreenshot, uploadProjectScreenshot);

module.exports = router;

