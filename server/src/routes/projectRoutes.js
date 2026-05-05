const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createProject,
  getMyProjects,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');

const router = express.Router();

router.route('/')
  .post(protect, createProject)
  .get(protect, getMyProjects);

router.route('/:id')
  .put(protect, updateProject)
  .delete(protect, deleteProject);

module.exports = router;
