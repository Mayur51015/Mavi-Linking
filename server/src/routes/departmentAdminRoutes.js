const express = require('express');
const { protect } = require('../middleware/auth');
const { requireDepartmentAdmin, enforceDepartmentScope } = require('../middleware/rbacMiddleware');
const {
  getDepartmentDashboard,
  getDepartmentStudents,
  getDepartmentStudentById,
  updateDepartmentStudentProfile,
  getDepartmentTeachers,
  getDepartmentAnalytics,
  getDepartmentReports,
  getDepartmentLeaderboard,
} = require('../controllers/departmentDashboardController');

const router = express.Router();

// All routes require authentication & Department Admin authorization + Department Scope
router.use(protect, requireDepartmentAdmin, enforceDepartmentScope);

router.get('/dashboard', getDepartmentDashboard);
router.get('/students', getDepartmentStudents);
router.get('/students/:studentId', getDepartmentStudentById);
router.patch('/students/:studentId/profile', updateDepartmentStudentProfile);
router.get('/teachers', getDepartmentTeachers);
router.get('/analytics', getDepartmentAnalytics);
router.get('/reports', getDepartmentReports);
router.get('/leaderboard', getDepartmentLeaderboard);

module.exports = router;
