const express = require('express');
const { protect } = require('../middleware/auth');
const {
  requireAdmin,
  requireSuperAdmin,
  requirePermission,
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
  createStaffUser,
  resendUserInvitation,
  getStudentsForAdmin,
  getStudentProfileForAdmin,
  updateStudentProfileForAdmin,
} = require('../controllers/adminController');

const {
  createInstitution,
  getInstitutions,
  getInstitutionById,
  updateInstitution,
  assignInstitutionAdmin,
  removeInstitutionAdmin,
} = require('../controllers/institutionController');

const {
  appointDepartmentAdmin,
  getDepartmentAdmins,
  getEligibleCandidates,
  reassignDepartmentAdmin,
  updateDepartmentAdminStatus,
  getAppointmentHistory,
} = require('../controllers/departmentAdminController');

const {
  createDepartment,
  getDepartments: getDepartmentsList,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');

const router = express.Router();

// All routes require JWT authentication + Admin role (Super Admin or Institution Admin)
router.use(protect, requireAdmin);

// Student Profile Management Authority (STUDENT_PROFILE_MANAGE permission + Tenant Scope)
router.get('/students', enforceInstitutionScope, requirePermission('STUDENT_PROFILE_MANAGE'), getStudentsForAdmin);
router.get('/students/:studentId/profile', enforceInstitutionScope, requirePermission('STUDENT_PROFILE_MANAGE'), getStudentProfileForAdmin);
router.patch('/students/:studentId/profile', enforceInstitutionScope, requirePermission('STUDENT_PROFILE_MANAGE'), updateStudentProfileForAdmin);
router.put('/students/:studentId/profile', enforceInstitutionScope, requirePermission('STUDENT_PROFILE_MANAGE'), updateStudentProfileForAdmin);

// Department Management CRUD & Governance
router.post('/departments', enforceInstitutionScope, createDepartment);
router.get('/departments', enforceInstitutionScope, getDepartmentsList);
router.put('/departments/:id', enforceInstitutionScope, updateDepartment);
router.delete('/departments/:id', enforceInstitutionScope, deleteDepartment);

// Department Admin Appointment & Governance
router.post('/departments/:departmentId/admins', enforceInstitutionScope, requirePermission('DEPARTMENT_ADMIN_APPOINT'), appointDepartmentAdmin);
router.get('/departments/:departmentId/admins', enforceInstitutionScope, requirePermission('DEPARTMENT_ADMIN_VIEW'), getDepartmentAdmins);
router.get('/departments/:departmentId/eligible-candidates', enforceInstitutionScope, requirePermission('DEPARTMENT_ADMIN_VIEW'), getEligibleCandidates);
router.get('/departments/:departmentId/appointment-history', enforceInstitutionScope, requirePermission('DEPARTMENT_ADMIN_VIEW'), getAppointmentHistory);

router.post('/department-admins', enforceInstitutionScope, requirePermission('DEPARTMENT_ADMIN_APPOINT'), appointDepartmentAdmin);
router.get('/department-admins', enforceInstitutionScope, requirePermission('DEPARTMENT_ADMIN_VIEW'), getDepartmentAdmins);
router.patch('/department-admins/:adminId/reassign', enforceInstitutionScope, requirePermission('DEPARTMENT_ADMIN_REASSIGN'), reassignDepartmentAdmin);
router.put('/department-admins/:adminId/status', enforceInstitutionScope, requirePermission('DEPARTMENT_ADMIN_SUSPEND'), updateDepartmentAdminStatus);

// Admin stats & user moderation (scoped by institution if institution_admin)
router.get('/stats', enforceInstitutionScope, getAdminStats);
router.get('/users', enforceInstitutionScope, getAllUsers);
router.post('/users', enforceInstitutionScope, createStaffUser);
router.post('/users/:userId/resend-invitation', enforceInstitutionScope, resendUserInvitation);
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
