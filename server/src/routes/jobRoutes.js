const express = require('express');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  createJob,
  getAllJobs,
  getRecruiterJobs,
  getJobDetails,
  updateJob,
  deleteJob,
  applyToJob,
} = require('../controllers/jobController');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAllJobs)
  .post(requireRole('recruiter', 'admin'), createJob);

router.get('/recruiter', requireRole('recruiter', 'admin'), getRecruiterJobs);

router.route('/:id')
  .get(getJobDetails)
  .put(requireRole('recruiter', 'admin'), updateJob)
  .delete(requireRole('recruiter', 'admin'), deleteJob);

router.post('/:id/apply', requireRole('user', 'admin'), applyToJob);

module.exports = router;
