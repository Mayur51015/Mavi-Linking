const express = require('express');
const { protect } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/rbacMiddleware');
const {
  getSuperAdminStats,
  getAllAdmins,
  createAdmin,
  removeAdmin,
  getSecurityEvents,
  getLicenses,
  getPlatformAnalytics,
  getPlatformSettings,
  updatePlatformSettings,
} = require('../controllers/superAdminController');

const {
  createInstitution,
  getInstitutions,
  getInstitutionById,
  updateInstitution,
  assignInstitutionAdmin,
  removeInstitutionAdmin,
} = require('../controllers/institutionController');

const router = express.Router();

// ALL Super Admin routes strictly require authentication + Super Admin authorization
router.use(protect, requireSuperAdmin);

// Super Admin Overview & Admin Management
router.get('/stats', getSuperAdminStats);
router.get('/admins', getAllAdmins);
router.post('/admins', createAdmin);
router.delete('/admins/:id', removeAdmin);
router.get('/security-events', getSecurityEvents);
router.get('/licenses', getLicenses);
router.get('/analytics', getPlatformAnalytics);
router.get('/settings', getPlatformSettings);
router.put('/settings', updatePlatformSettings);

// Multi-College & Institution Governance
router.get('/institutions', getInstitutions);
router.get('/institutions/:id', getInstitutionById);
router.post('/institutions', createInstitution);
router.put('/institutions/:id', updateInstitution);
router.post('/institutions/:id/assign-admin', assignInstitutionAdmin);
router.post('/institutions/:id/invite-admin', createAdmin);
router.post('/institutions/:id/remove-admin', removeInstitutionAdmin);

// Super Admin Billing Oversight & Plan Assignment
const { getSuperAdminBillingOverview, assignInstitutionPlan } = require('../controllers/billingController');
router.get('/billing/institutions', getSuperAdminBillingOverview);
router.post('/billing/assign-plan', assignInstitutionPlan);

module.exports = router;
