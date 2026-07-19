const express = require('express');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  getMyStudents,
  getStudentDetail,
  getReadiness,
  getLeaderboard,
  getDepartmentStats,
  verifyStudentItem,
  recommendStudent,
  getBatchAnalytics,
  exportPdfReport,
  createPlacementDrive,
  getPlacementDrives,
  updatePlacementDrive,
  deletePlacementDrive,
  assignStudentsToDrive,
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  getMentoringAlerts,
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

// Student Verification & Recommendations
router.put('/verify/:studentId/:itemType/:itemId', verifyStudentItem);
router.get('/mentoring-alerts', getMentoringAlerts);
router.post('/recommend/:studentId/:recruiterId', recommendStudent);

// Batch & Comparative Analytics
router.get('/batch-analytics', getBatchAnalytics);

// Report Generation
router.get('/reports/export', exportPdfReport);

// Placement Drives CRUD
router.route('/drives')
  .get(getPlacementDrives)
  .post(createPlacementDrive);

router.route('/drives/:id')
  .put(updatePlacementDrive)
  .delete(deletePlacementDrive);

router.post('/drives/:id/assign', assignStudentsToDrive);

// Announcements CRUD
router.route('/announcements')
  .get(getAnnouncements)
  .post(createAnnouncement);

router.route('/announcements/:id')
  .put(updateAnnouncement)
  .delete(deleteAnnouncement);

module.exports = router;
