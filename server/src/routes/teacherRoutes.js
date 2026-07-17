const express = require('express');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  getMyStudents,
  getStudentDetail,
  getReadiness,
  getLeaderboard,
  getDepartmentStats,
  createPlacementDrive,
  getPlacementDrives,
  verifyStudent
} = require('../controllers/teacherController');

const router = express.Router();

// All teacher routes require authentication + teacher role
router.use(protect, requireRole('teacher', 'admin'));

// Stats & Leaderboard
router.get('/stats', getDepartmentStats);
router.get('/readiness', getReadiness);
router.get('/leaderboard', getLeaderboard);

// Placement Drives
router.route('/drives')
  .post(createPlacementDrive)
  .get(getPlacementDrives);

// Students
router.get('/students', getMyStudents);
router.get('/students/:studentId', getStudentDetail);
router.put('/students/:studentId/verify', verifyStudent);

module.exports = router;
