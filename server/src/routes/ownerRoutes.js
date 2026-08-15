const express = require('express');
const { protect } = require('../middleware/auth');
const { requireOwner } = require('../middleware/rbacMiddleware');
const {
  getOwnerOverview,
  getTenants,
  createTenant,
  updateTenant,
  getPermissions,
  getRoles,
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  getAdmins,
  inviteAdmin,
  updateAdmin,
  suspendAdmin,
  reactivateAdmin,
  resendAdminInvite,
  revokeAdminInvite,
  toggleAdminStatus,
  convertSuperAdminToStudent,
  getUsers,
  toggleUserStatus,
  getLicensing,
  updateLicense,
  getSubscriptions,
  getPlatformAnalytics,
  getSecurityEvents,
  getSystemConfig,
  updateSystemConfig,
  getAuditLogs,
} = require('../controllers/ownerController');

const router = express.Router();

// Enforce authentication & Platform Owner authorization on all /api/owner/* routes
router.use(protect, requireOwner);

// Platform Overview
router.get('/overview', getOwnerOverview);
router.get('/stats', getOwnerOverview);

// Tenants / Institutions Management
router.get('/tenants', getTenants);
router.get('/institutions', getTenants);
router.post('/tenants', createTenant);
router.post('/institutions', createTenant);
router.put('/tenants/:id', updateTenant);
router.put('/institutions/:id', updateTenant);

// Permissions & Custom Role Governance
router.get('/permissions', getPermissions);
router.get('/roles', getRoles);
router.post('/roles', createCustomRole);
router.put('/roles/:id', updateCustomRole);
router.delete('/roles/:id', deleteCustomRole);

// Admin Management & Invitation Lifecycle
router.get('/admins', getAdmins);
router.post('/admins/invite', inviteAdmin);
router.put('/admins/:id', updateAdmin);
router.patch('/admins/:id/suspend', suspendAdmin);
router.patch('/admins/:id/reactivate', reactivateAdmin);
router.post('/admins/:id/resend-invite', resendAdminInvite);
router.patch('/admins/:id/revoke-invite', revokeAdminInvite);
router.put('/admins/:id/status', toggleAdminStatus);
router.post('/admins/:id/convert-to-student', convertSuperAdminToStudent);

// Platform Users Management
router.get('/users', getUsers);
router.put('/users/:id/status', toggleUserStatus);

// Licensing
router.get('/licensing', getLicensing);
router.get('/licenses', getLicensing);
router.put('/licensing/:id', updateLicense);

// Subscriptions & SaaS Plan Governance
router.get('/subscriptions', getSubscriptions);
const {
  getOwnerPlans,
  createOwnerPlan,
  updateOwnerPlan,
  setOwnerPlanStatus,
  getOwnerBillingOverview,
} = require('../controllers/billingController');

router.get('/plans', getOwnerPlans);
router.post('/plans', createOwnerPlan);
router.put('/plans/:id', updateOwnerPlan);
router.patch('/plans/:id/status', setOwnerPlanStatus);
router.get('/billing/overview', getOwnerBillingOverview);

// Global Analytics
router.get('/analytics', getPlatformAnalytics);

// Security Center
router.get('/security-events', getSecurityEvents);
router.get('/security', getSecurityEvents);

// System Configuration
router.get('/configuration', getSystemConfig);
router.get('/system', getSystemConfig);
router.put('/configuration', updateSystemConfig);

// Global Audit Logs
router.get('/audit-logs', getAuditLogs);
router.get('/audit', getAuditLogs);

module.exports = router;
