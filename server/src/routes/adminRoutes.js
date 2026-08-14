const express = require('express');
const { protect } = require('../middleware/auth');
const {
  requireAdmin,
  requireSuperAdmin,
  enforceInstitutionScope,
} = require('../middleware/rbacMiddleware');

const {
  getAdminStats,
  getAllUsers,
  updateUser,
  updateUserStatus,
  deleteUser,
  getAuditLogs,
  getRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
  getPrnVerifications,
  approvePrnVerification,
  rejectPrnVerification,
  getDepartments,
  updateMyInstitutionSettings,
  updateUserInstitution,
} = require('../controllers/adminController');

const {
  createInstitution,
  getInstitutions,
  getInstitutionById,
  updateInstitution,
  assignInstitutionAdmin,
  removeInstitutionAdmin,
} = require('../controllers/institutionController');

const router = express.Router();

// All routes require JWT authentication + Admin role (Super Admin or Institution Admin)
router.use(protect, requireAdmin);

// Admin stats & user moderation (scoped by institution if institution_admin)
router.get('/stats', enforceInstitutionScope, getAdminStats);
router.get('/users', enforceInstitutionScope, getAllUsers);
router.put('/users/:id', enforceInstitutionScope, updateUser);
router.put('/users/:id/status', enforceInstitutionScope, updateUserStatus);
router.patch('/users/:userId/institution', updateUserInstitution);
router.put('/users/:userId/institution', updateUserInstitution);
router.patch('/users/:id/institution', updateUserInstitution);
router.put('/users/:id/institution', updateUserInstitution);
router.delete('/users/:id', enforceInstitutionScope, deleteUser);
router.get('/logs', enforceInstitutionScope, getAuditLogs);
router.get('/departments', enforceInstitutionScope, getDepartments);
router.put('/my-institution', enforceInstitutionScope, updateMyInstitutionSettings);

// Role Requests & Verifications
router.get('/role-requests', enforceInstitutionScope, getRoleRequests);
router.post('/role-requests/:id/approve', enforceInstitutionScope, approveRoleRequest);
router.post('/role-requests/:id/reject', enforceInstitutionScope, rejectRoleRequest);

// PRN & Institutional Identity Verifications
router.get('/prn-verifications', enforceInstitutionScope, getPrnVerifications);
router.post('/prn-verifications/:id/approve', enforceInstitutionScope, approvePrnVerification);
router.post('/prn-verifications/:id/reject', enforceInstitutionScope, rejectPrnVerification);

// Institutions Management
router.get('/institutions', enforceInstitutionScope, getInstitutions);
router.get('/institutions/:id', enforceInstitutionScope, getInstitutionById);

// Super Admin Only Institution Control Routes
router.post('/institutions', requireSuperAdmin, createInstitution);
router.put('/institutions/:id', requireSuperAdmin, updateInstitution);
router.post('/institutions/:id/assign-admin', requireSuperAdmin, assignInstitutionAdmin);
router.post('/institutions/:id/remove-admin', requireSuperAdmin, removeInstitutionAdmin);

module.exports = router;
