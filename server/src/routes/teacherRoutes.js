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
  deleteAnnouncement,
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

// Student Verification & Recommendations
router.put('/verify/:studentId/:itemType/:itemId', verifyStudentItem);
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

router.delete('/announcements/:id', deleteAnnouncement);

module.exports = router;
