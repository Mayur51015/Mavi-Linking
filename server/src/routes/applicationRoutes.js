const express = require('express');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  applyForJob,
  getApplications,
  updateApplicationStatus,
  scheduleInterview,
  getInterviews
} = require('../controllers/applicationController');

const router = express.Router();

router.use(protect);

router.post('/', applyForJob); // Student applies for a job
router.get('/', getApplications); // Recruiter gets applications for their jobs / Student gets their applications

router.put('/:id/status', requireRole('recruiter', 'admin'), updateApplicationStatus);

// Interview routes nested within applications or separate
router.post('/:id/interview', requireRole('recruiter', 'admin'), scheduleInterview);
router.get('/interviews/all', getInterviews); // Get interviews for current user

module.exports = router;
