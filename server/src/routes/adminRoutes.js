const express = require('express');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  getAdminStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAuditLogs,
  getRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, requireRole('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/logs', getAuditLogs);

// Role Approval & Management Routes
router.get('/role-requests', getRoleRequests);
router.post('/role-requests/:id/approve', approveRoleRequest);
router.post('/role-requests/:id/reject', rejectRoleRequest);

module.exports = router;
