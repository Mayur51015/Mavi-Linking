const express = require('express');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  getMyStudents,
  getStudentDetail,
  getReadiness,
  getLeaderboard,
  getDepartmentStats,
} = require('../controllers/teacherController');

const router = express.Router();

// All teacher routes require authentication + teacher role
router.use(protect, requireRole('teacher', 'admin'));

// Teacher auto-scoped to their own college/department
router.get('/students', getMyStudents);
router.get('/students/:studentId', getStudentDetail);
router.get('/readiness', getReadiness);
router.get('/leaderboard', getLeaderboard);
router.get('/stats', getDepartmentStats);

module.exports = router;
