const express = require('express');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob
} = require('../controllers/jobController');

const router = express.Router();

// Publicly viewable jobs, but let's make it protected for now to candidates and recruiters
router.use(protect);

router.get('/', getJobs);
router.get('/:id', getJobById);

router.use(requireRole('recruiter', 'admin'));
router.post('/', createJob);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

module.exports = router;
