const express = require('express');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  createPipeline,
  updatePipelineStatus,
  updateInterviewDetails,
  updateOfferDetails,
  getRecruiterPipelines,
  getStudentPipelines,
  getPipelineById,
  getPipelineStats,
  updateAvailability,
  getAvailability,
} = require('../controllers/placementController');

const router = express.Router();

// All placement routes require authentication
router.use(protect);

// ─── Student Availability Routes ────────────────────────────────────────────
router.get('/availability', requireRole('user', 'admin'), getAvailability);
router.put('/availability', requireRole('user', 'admin'), updateAvailability);

// ─── Student Pipeline Routes ────────────────────────────────────────────────
router.get('/student/pipelines', requireRole('user', 'admin'), getStudentPipelines);

// ─── Recruiter Pipeline Routes ──────────────────────────────────────────────
router.get('/stats', requireRole('recruiter', 'admin'), getPipelineStats);
router.get('/pipeline', requireRole('recruiter', 'admin'), getRecruiterPipelines);
router.post('/pipeline', requireRole('recruiter', 'admin'), createPipeline);

// ─── Pipeline Detail Routes (accessible to both student & recruiter) ────────
router.get('/pipeline/:id', getPipelineById);
router.put('/pipeline/:id/status', requireRole('recruiter', 'admin'), updatePipelineStatus);
router.put('/pipeline/:id/interview', requireRole('recruiter', 'admin'), updateInterviewDetails);
router.put('/pipeline/:id/offer', requireRole('recruiter', 'admin'), updateOfferDetails);

module.exports = router;
