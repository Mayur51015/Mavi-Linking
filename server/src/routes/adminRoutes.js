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
  suspendUser,
  deactivateUser,
  reactivateUser,
  deleteUserPermanently,
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
  getPendingStudentApprovals,
  approveStudentAccount,
  rejectStudentAccount,
  assignFacultyDepartment,
} = require('../controllers/adminController');

const {
  createInstitution,
  getInstitutions,
  getInstitutionById,
  updateInstitution,
  assignInstitutionAdmin,
  removeInstitutionAdmin,
  uploadInstitutionLogo,
} = require('../controllers/institutionController');
const { uploadLogo } = require('../middleware/uploadMiddleware');


const {
  appointDepartmentAdmin,
  getDepartmentAdmins,
  getEligibleCandidates,
  reassignDepartmentAdmin,
  updateDepartmentAdminStatus,
  getAppointmentHistory,
  resendDepartmentAdminInvite,
} = require('../controllers/departmentAdminController');

const {
  createDepartment,
  getDepartments: getDepartmentsList,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');

const {
  verifyAdminInvite,
  acceptAdminInvite,
} = require('../controllers/authController');

const { authLimiter } = require('../middleware/authLimiter');

const router = express.Router();

// ─── Public Invitation Endpoints (Pre-Authentication) ────────────────────────
router.get('/invitations/validate', authLimiter, verifyAdminInvite);
router.get('/invitations/validate/:token', authLimiter, verifyAdminInvite);
router.post('/invitations/activate', authLimiter, acceptAdminInvite);
router.post('/invitations/accept', authLimiter, acceptAdminInvite);

// All other routes require JWT authentication + Admin role (Super Admin or Institution Admin)
router.use(protect, requireAdmin);

// Student 2-Stage Verification & Approval Authority (Tenant/Department Scoped)
router.get('/students/pending', getPendingStudentApprovals);
router.post('/students/:studentId/approve', approveStudentAccount);
router.post('/students/:studentId/reject', rejectStudentAccount);

// Student Profile Management Authority (STUDENT_PROFILE_MANAGE permission + Tenant Scope)
router.get('/students', enforceInstitutionScope, requirePermission('STUDENT_PROFILE_MANAGE'), getStudentsForAdmin);
router.get('/students/:studentId/profile', enforceInstitutionScope, requirePermission('STUDENT_PROFILE_MANAGE'), getStudentProfileForAdmin);
router.patch('/students/:studentId/profile', enforceInstitutionScope, requirePermission('STUDENT_PROFILE_MANAGE'), updateStudentProfileForAdmin);
router.put('/students/:studentId/profile', enforceInstitutionScope, requirePermission('STUDENT_PROFILE_MANAGE'), updateStudentProfileForAdmin);

// Department Management CRUD & Governance (Delete restricted to Platform Super Admin / Owner)
router.post('/departments', enforceInstitutionScope, createDepartment);
router.get('/departments', enforceInstitutionScope, getDepartmentsList);
router.put('/departments/:id', enforceInstitutionScope, updateDepartment);
router.delete('/departments/:id', requireSuperAdmin, deleteDepartment);

// Faculty & User Department Assignment & Governance
router.put('/users/:id/department', enforceInstitutionScope, assignFacultyDepartment);
router.post('/faculty/assign-department', enforceInstitutionScope, assignFacultyDepartment);

// Department Admin Appointment & Governance
router.post('/departments/:departmentId/admins', enforceInstitutionScope, requirePermission('DEPARTMENT_ADMIN_APPOINT'), appointDepartmentAdmin);
router.get('/departments/:departmentId/admins', enforceInstitutionScope, requirePermission('DEPARTMENT_ADMIN_VIEW'), getDepartmentAdmins);
router.get('/departments/:departmentId/eligible-candidates', enforceInstitutionScope, requirePermission('DEPARTMENT_ADMIN_VIEW'), getEligibleCandidates);
router.get('/departments/:departmentId/appointment-history', enforceInstitutionScope, requirePermission('DEPARTMENT_ADMIN_VIEW'), getAppointmentHistory);

router.post('/department-admins', enforceInstitutionScope, requirePermission('DEPARTMENT_ADMIN_APPOINT'), appointDepartmentAdmin);
router.get('/department-admins', enforceInstitutionScope, requirePermission('DEPARTMENT_ADMIN_VIEW'), getDepartmentAdmins);
router.post('/department-admins/:adminId/resend-invite', enforceInstitutionScope, requirePermission('DEPARTMENT_ADMIN_APPOINT'), resendDepartmentAdminInvite);
router.post('/departments/:departmentId/admins/:adminId/resend-invite', enforceInstitutionScope, requirePermission('DEPARTMENT_ADMIN_APPOINT'), resendDepartmentAdminInvite);
router.patch('/department-admins/:adminId/reassign', enforceInstitutionScope, requirePermission('DEPARTMENT_ADMIN_REASSIGN'), reassignDepartmentAdmin);
router.put('/department-admins/:adminId/status', enforceInstitutionScope, requirePermission('DEPARTMENT_ADMIN_SUSPEND'), updateDepartmentAdminStatus);

// User Lifecycle Management (Suspend, Deactivate, Reactivate, Permanent Delete)
router.post('/users/:id/suspend', enforceInstitutionScope, suspendUser);
router.put('/users/:id/suspend', enforceInstitutionScope, suspendUser);
router.patch('/users/:id/suspend', enforceInstitutionScope, suspendUser);

router.post('/users/:id/deactivate', enforceInstitutionScope, deactivateUser);
router.put('/users/:id/deactivate', enforceInstitutionScope, deactivateUser);
router.patch('/users/:id/deactivate', enforceInstitutionScope, deactivateUser);

router.post('/users/:id/reactivate', enforceInstitutionScope, reactivateUser);
router.put('/users/:id/reactivate', enforceInstitutionScope, reactivateUser);
router.patch('/users/:id/reactivate', enforceInstitutionScope, reactivateUser);

router.delete('/users/:id/permanent', enforceInstitutionScope, deleteUserPermanently);
router.delete('/users/:id', enforceInstitutionScope, deleteUserPermanently);

// User Profile & Settings
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
router.get('/logs', enforceInstitutionScope, getAuditLogs);
router.put('/my-institution', enforceInstitutionScope, updateMyInstitutionSettings);
router.post('/my-institution/logo', enforceInstitutionScope, uploadLogo, uploadInstitutionLogo);

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
router.post('/institutions/:id/logo', requireSuperAdmin, uploadLogo, uploadInstitutionLogo);
router.post('/institutions/:id/assign-admin', requireSuperAdmin, assignInstitutionAdmin);
router.post('/institutions/:id/remove-admin', requireSuperAdmin, removeInstitutionAdmin);


// System & SMTP Health Diagnostic (Super Admin / Platform Owner)
router.get('/system/smtp-status', requireSuperAdmin, async (req, res) => {
  const { verifySmtpConnection } = require('../utils/sendEmail');
  const result = await verifySmtpConnection();
  return res.status(result.success ? 200 : 500).json(result);
});

router.post('/system/test-email', requireSuperAdmin, async (req, res) => {
  const { sendEmail } = require('../utils/sendEmail');
  const { to } = req.body;
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid recipient email ("to") is required.' });
  }
  const result = await sendEmail({
    to,
    subject: 'EduTalentX — Administrative SMTP Diagnostic Test',
    html: '<p>This is a test email dispatched from the EduTalentX administration diagnostic utility.</p>',
    templateName: 'admin-diagnostic-test',
  });
  return res.status(result.success ? 200 : 500).json(result);
});

module.exports = router;
