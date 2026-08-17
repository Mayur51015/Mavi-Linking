const crypto = require('crypto');
const User = require('../models/User');
const Department = require('../models/Department');
const Institution = require('../models/Institution');
const AuditLog = require('../models/AuditLog');
const { sendEmail, sendAdminInvitationEmail, generateAccountInvitationEmailHtml } = require('../utils/sendEmail');

/**
 * @desc    Create a new institution-provisioned Department Admin account
 * @route   POST /api/admin/departments/:departmentId/admins
 * @route   POST /api/admin/department-admins
 * @access  Private (Owner, Super Admin, Institution Admin with DEPARTMENT_ADMIN_APPOINT)
 */
const createDepartmentAdmin = async (req, res, next) => {
  try {
    const departmentId = req.params.departmentId || req.body.departmentId;
    const { name, email, phone, employeeId, identifierValue, designation } = req.body;

    const adminIdValue = (employeeId || identifierValue || '').trim();

    if (!name || !name.trim() || !email || !email.trim() || !departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email address, and department selection are required for Department Admin creation.',
      });
    }

    const lowerEmail = email.toLowerCase().trim();

    // 1. Load & Validate Target Department
    const department = await Department.findById(departmentId).populate('institutionId', 'name code tenantId');
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Target department not found.',
      });
    }

    const institution = department.institutionId;
    const targetInstId = institution ? (institution._id || institution).toString() : null;

    // 2. Tenant Isolation Check:
    // Institution Admin can ONLY create Department Admins for departments in their own institution
    if (req.institutionScope?.institutionId) {
      const reqInstId = req.institutionScope.institutionId.toString();
      if (!targetInstId || targetInstId !== reqInstId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. You cannot create a Department Admin for another institution.',
        });
      }
    }

    const clientUrl = process.env.CLIENT_URL || process.env.PUBLIC_APP_URL || 'http://localhost:5173';

    // 3. Handle Existing User Appointment or Duplicate Check
    const existingUser = await User.findOne({ email: lowerEmail });
    if (existingUser) {
      if (existingUser.role === 'department_admin') {
        return res.status(409).json({
          success: false,
          code: 'EMAIL_EXISTS',
          message: `An active Department Admin account with email '${lowerEmail}' already exists. Use 'Reassign' or 'Resend Invite' to manage their assignment.`,
        });
      }

      // Appoint existing user as Department Admin
      const rawInviteToken = crypto.randomBytes(32).toString('hex');
      const oldRole = existingUser.role;
      existingUser.role = 'department_admin';
      if (!Array.isArray(existingUser.roles)) existingUser.roles = [existingUser.role];
      if (!existingUser.roles.includes('department_admin')) existingUser.roles.push('department_admin');
      
      existingUser.departmentId = department._id;
      existingUser.institutionId = targetInstId || existingUser.institutionId;
      existingUser.designation = designation ? designation.trim() : existingUser.designation || 'Department Administrator';
      if (adminIdValue) {
        existingUser.institutionalIdentifier = {
          identifierType: 'EMPLOYEE_ID',
          identifierValue: adminIdValue,
        };
      }
      existingUser.invitationToken = rawInviteToken;
      existingUser.invitationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
      existingUser.accountStatus = 'INVITED';
      existingUser.isInvitedAdmin = true;
      existingUser.invitedBy = req.user._id;
      existingUser.invitedAt = new Date();
      await existingUser.save();

      await AuditLog.create({
        actorId: req.user._id,
        actorRole: req.user.role,
        targetUserId: existingUser._id,
        previousRole: oldRole,
        newRole: 'department_admin',
        institutionId: targetInstId,
        departmentId: department._id,
        tenantId: existingUser.tenantId || '',
        action: 'DEPARTMENT_ADMIN_APPOINTED',
        details: {
          departmentName: department.name,
          institutionName: institution?.name || '',
        },
        result: 'SUCCESS',
      });

      // Dispatch Invitation Email to Promoted User
      const invitationLink = `${clientUrl}/admin/accept-invite?token=${rawInviteToken}`;
      const emailResult = await sendAdminInvitationEmail({
        to: lowerEmail,
        name: existingUser.name,
        role: 'department_admin',
        institutionName: institution?.name || 'Authorized Institution',
        departmentName: department.name,
        managementScope: 'DEPARTMENT',
        invitationLink,
        expiresHours: 48,
      });

      if (emailResult.success) {
        await AuditLog.create({
          actorId: req.user._id,
          targetUserId: existingUser._id,
          action: 'ADMIN_INVITATION_EMAIL_SENT',
          institutionId: targetInstId,
          departmentId: department._id,
          details: { email: lowerEmail, messageId: emailResult.messageId },
          result: 'SUCCESS',
        });
      } else {
        await AuditLog.create({
          actorId: req.user._id,
          targetUserId: existingUser._id,
          action: 'ADMIN_INVITATION_EMAIL_FAILED',
          institutionId: targetInstId,
          departmentId: department._id,
          details: { email: lowerEmail, error: emailResult.error },
          result: 'FAILED',
        });
      }

      const userPayload = existingUser.toObject ? existingUser.toObject() : { ...existingUser };
      delete userPayload.invitationToken;
      delete userPayload.password;

      return res.status(200).json({
        success: true,
        administratorCreated: true,
        emailSent: emailResult.success,
        recipient: lowerEmail,
        message: emailResult.success
          ? `Successfully appointed ${existingUser.name} (${lowerEmail}) as Department Admin for ${department.name}. Invitation email sent.`
          : `Appointed ${existingUser.name} as Department Admin, but invitation email could not be sent.`,
        data: {
          user: userPayload,
          emailSent: emailResult.success,
          recipient: lowerEmail,
        },
      });
    }

    // 4. Check Duplicate Employee/Admin Identifier in Institution (if provided)
    if (targetInstId && adminIdValue) {
      const existingId = await User.findOne({
        institutionId: targetInstId,
        'institutionalIdentifier.identifierValue': adminIdValue,
      });

      if (existingId) {
        return res.status(409).json({
          success: false,
          code: 'IDENTIFIER_EXISTS',
          message: `An account with identifier '${adminIdValue}' already exists for this institution.`,
        });
      }
    }

    // 5. Generate System MAVI ID
    const generatedMaviId = `MAVI-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // 6. Single-Use Cryptographic Invitation Token & 48h Expiration
    const rawInviteToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // 7. Create User Document in INVITED State (Zero Password!)
    const newDeptAdmin = await User.create({
      name: name.trim(),
      email: lowerEmail,
      role: 'department_admin',
      roles: ['department_admin', 'user'],
      maviId: generatedMaviId,
      institutionId: targetInstId,
      departmentId: department._id,
      tenantId: institution?.tenantId || req.user.tenantId || '',
      designation: designation ? designation.trim() : 'Department Administrator',
      phone: phone ? phone.trim() : '',
      university: {
        name: institution?.name || '',
        department: department.name,
      },
      institutionalIdentifier: {
        identifierType: 'EMPLOYEE_ID',
        identifierValue: adminIdValue || generatedMaviId,
      },
      permissions: [
        'DEPARTMENT_STUDENTS_VIEW',
        'DEPARTMENT_STUDENTS_EDIT',
        'DEPARTMENT_TEACHERS_VIEW',
        'DEPARTMENT_ANALYTICS_VIEW',
        'DEPARTMENT_REPORTS_GENERATE',
      ],
      accountStatus: 'INVITED',
      status: 'active',
      emailVerified: true,
      passwordSetupRequired: true,
      mustChangePassword: true,
      isInvitedAdmin: true,
      invitationToken: rawInviteToken,
      invitationExpires,
      invitedBy: req.user._id,
      invitedAt: new Date(),
    });

    // Optionally set department headUserId if unassigned
    if (!department.headUserId) {
      department.headUserId = newDeptAdmin._id;
      await department.save();
    }

    // 8. Log Governance Audit Events
    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      targetUserId: newDeptAdmin._id,
      previousRole: 'none',
      newRole: 'department_admin',
      institutionId: targetInstId,
      departmentId: department._id,
      tenantId: newDeptAdmin.tenantId,
      action: 'DEPARTMENT_ADMIN_CREATED',
      details: {
        departmentName: department.name,
        institutionName: institution?.name || '',
      },
      result: 'SUCCESS',
    });

    // 9. Send Secure Invitation Email
    const invitationLink = `${clientUrl}/admin/accept-invite?token=${rawInviteToken}`;
    const emailResult = await sendAdminInvitationEmail({
      to: lowerEmail,
      name: newDeptAdmin.name,
      role: 'department_admin',
      institutionName: institution?.name || 'Authorized Institution',
      departmentName: department.name,
      managementScope: 'DEPARTMENT',
      invitationLink,
      expiresHours: 48,
    });

    if (emailResult.success) {
      await AuditLog.create({
        actorId: req.user._id,
        targetUserId: newDeptAdmin._id,
        action: 'ADMIN_INVITATION_EMAIL_SENT',
        institutionId: targetInstId,
        departmentId: department._id,
        details: { email: lowerEmail, messageId: emailResult.messageId },
        result: 'SUCCESS',
      });
    } else {
      await AuditLog.create({
        actorId: req.user._id,
        targetUserId: newDeptAdmin._id,
        action: 'ADMIN_INVITATION_EMAIL_FAILED',
        institutionId: targetInstId,
        departmentId: department._id,
        details: { email: lowerEmail, error: emailResult.error },
        result: 'FAILED',
      });
    }

    res.status(201).json({
      success: true,
      administratorCreated: true,
      emailSent: emailResult.success,
      recipient: newDeptAdmin.email,
      message: emailResult.success
        ? `Successfully provisioned Department Admin account for ${newDeptAdmin.name}. Invitation email sent.`
        : `Provisioned Department Admin account for ${newDeptAdmin.name}, but invitation email could not be sent.`,
      data: {
        id: newDeptAdmin._id,
        name: newDeptAdmin.name,
        email: newDeptAdmin.email,
        maviId: newDeptAdmin.maviId,
        role: newDeptAdmin.role,
        accountStatus: newDeptAdmin.accountStatus,
        emailSent: emailResult.success,
        recipient: newDeptAdmin.email,
        department: {
          id: department._id,
          name: department.name,
          code: department.code,
        },
        institution: {
          id: institution?._id,
          name: institution?.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all Department Admins within current institution scope
 * @route   GET /api/admin/department-admins
 * @access  Private (Owner, Super Admin, Institution Admin)
 */
const getDepartmentAdmins = async (req, res, next) => {
  try {
    const query = { role: 'department_admin' };

    if (req.institutionScope?.institutionId) {
      query.institutionId = req.institutionScope.institutionId;
    }

    const admins = await User.find(query)
      .select('name email maviId role status accountStatus designation phone avatar createdAt')
      .populate('institutionId', 'name code tenantId')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: admins,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get eligible candidate teachers/staff for appointment in a department
 * @route   GET /api/admin/departments/:departmentId/eligible-candidates
 * @access  Private (Owner, Super Admin, Institution Admin)
 */
const getEligibleCandidates = async (req, res, next) => {
  try {
    const { departmentId } = req.params;

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    const targetInstId = department.institutionId;

    if (req.institutionScope?.institutionId) {
      if (targetInstId.toString() !== req.institutionScope.institutionId.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden. Access denied for another institution.' });
      }
    }

    // Find active teachers/staff in the institution who are NOT super_admin / platform_owner
    const candidates = await User.find({
      institutionId: targetInstId,
      status: 'active',
      role: { $in: ['teacher', 'user', 'admin', 'professor'] },
    })
      .select('name email maviId role designation department university avatar')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: candidates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reassign a Department Admin to a new department within the institution
 * @route   PATCH /api/admin/department-admins/:adminId/reassign
 * @access  Private (Owner, Super Admin, Institution Admin)
 */
const reassignDepartmentAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    const { newDepartmentId } = req.body;

    if (!newDepartmentId) {
      return res.status(400).json({ success: false, message: 'New Department ID is required.' });
    }

    const deptAdmin = await User.findById(adminId);
    if (!deptAdmin || deptAdmin.role !== 'department_admin') {
      return res.status(404).json({ success: false, message: 'Department Admin not found.' });
    }

    // Tenant Check
    if (req.institutionScope?.institutionId) {
      if (deptAdmin.institutionId?.toString() !== req.institutionScope.institutionId.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden. Access denied for another institution.' });
      }
    }

    const newDept = await Department.findById(newDepartmentId);
    if (!newDept) {
      return res.status(404).json({ success: false, message: 'Target new department not found.' });
    }

    if (newDept.institutionId.toString() !== deptAdmin.institutionId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. New department must belong to the same institution.' });
    }

    const oldDeptId = deptAdmin.departmentId;
    deptAdmin.departmentId = newDept._id;
    await deptAdmin.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      targetUserId: deptAdmin._id,
      institutionId: deptAdmin.institutionId,
      departmentId: newDept._id,
      action: 'DEPARTMENT_ADMIN_REASSIGNED',
      details: { oldDepartmentId: oldDeptId, newDepartmentId: newDept._id, newDepartmentName: newDept.name },
      result: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: `Reassigned ${deptAdmin.name} to department ${newDept.name}.`,
      data: deptAdmin,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Suspend or Reactivate a Department Admin with Last Admin protection
 * @route   PUT /api/admin/department-admins/:adminId/status
 * @access  Private (Owner, Super Admin, Institution Admin)
 */
const updateDepartmentAdminStatus = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    const { status, reason } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be active or suspended.' });
    }

    const deptAdmin = await User.findById(adminId);
    if (!deptAdmin || deptAdmin.role !== 'department_admin') {
      return res.status(404).json({ success: false, message: 'Department Admin record not found.' });
    }

    // Tenant check
    if (req.institutionScope?.institutionId) {
      if (deptAdmin.institutionId?.toString() !== req.institutionScope.institutionId.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden. Access denied for another institution.' });
      }
    }

    // Last Admin Protection Check on Suspension
    if (status === 'suspended' && deptAdmin.departmentId) {
      const activeAdminsCount = await User.countDocuments({
        departmentId: deptAdmin.departmentId,
        role: 'department_admin',
        status: 'active',
      });

      if (activeAdminsCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot suspend the only active Department Admin for this department. Appoint a replacement first.',
        });
      }
    }

    deptAdmin.status = status;
    if (status === 'active') {
      deptAdmin.accountStatus = 'ACTIVE';
      deptAdmin.roleStatus = 'approved';
    } else if (status === 'suspended') {
      deptAdmin.accountStatus = 'SUSPENDED';
    }
    await deptAdmin.save();

    const actionType = status === 'suspended' ? 'DEPARTMENT_ADMIN_SUSPENDED' : 'DEPARTMENT_ADMIN_REACTIVATED';
    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      targetUserId: deptAdmin._id,
      institutionId: deptAdmin.institutionId,
      departmentId: deptAdmin.departmentId,
      action: actionType,
      details: { reason: reason || '' },
      result: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: `Department Admin status updated to ${status}.`,
      data: deptAdmin,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Department Admin appointment history
 * @route   GET /api/admin/departments/:departmentId/appointment-history
 * @access  Private (Owner, Super Admin, Institution Admin)
 */
const getAppointmentHistory = async (req, res, next) => {
  try {
    const { departmentId } = req.params;

    const history = await AuditLog.find({
      departmentId,
      action: { $in: ['DEPARTMENT_ADMIN_APPOINTED', 'DEPARTMENT_ADMIN_REASSIGNED', 'DEPARTMENT_ADMIN_SUSPENDED', 'DEPARTMENT_ADMIN_REACTIVATED'] },
    })
      .populate('actorId', 'name role email')
      .populate('targetUserId', 'name email maviId role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDepartmentAdmin,
  appointDepartmentAdmin: createDepartmentAdmin, // Alias for backward compatibility
  getDepartmentAdmins,
  getEligibleCandidates,
  reassignDepartmentAdmin,
  updateDepartmentAdminStatus,
  getAppointmentHistory,
};
