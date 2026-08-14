const express = require('express');
const { protect } = require('../middleware/auth');
const { requireDepartmentAdmin, enforceDepartmentScope } = require('../middleware/rbacMiddleware');
const {
  getDepartmentDashboard,
  getDepartmentStudents,
  getDepartmentTeachers,
} = require('../controllers/departmentDashboardController');

const router = express.Router();

// All routes require authentication & Department Admin authorization (or higher) + Department Scope
router.use(protect, requireDepartmentAdmin, enforceDepartmentScope);

router.get('/dashboard', getDepartmentDashboard);
router.get('/students', getDepartmentStudents);
router.get('/teachers', getDepartmentTeachers);

module.exports = router;
