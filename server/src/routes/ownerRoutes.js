const express = require('express');
const { protect } = require('../middleware/auth');
const { requireOwner } = require('../middleware/rbacMiddleware');
const {
  getOwnerOverview,
  getTenants,
  createTenant,
  updateTenant,
  getAdmins,
  inviteAdmin,
  toggleAdminStatus,
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

// Admin Management
router.get('/admins', getAdmins);
router.post('/admins/invite', inviteAdmin);
router.put('/admins/:id/status', toggleAdminStatus);

// Platform Users Management
router.get('/users', getUsers);
router.put('/users/:id/status', toggleUserStatus);

// Licensing
router.get('/licensing', getLicensing);
router.get('/licenses', getLicensing);
router.put('/licensing/:id', updateLicense);

// Subscriptions
router.get('/subscriptions', getSubscriptions);

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
