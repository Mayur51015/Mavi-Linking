const crypto = require('crypto');
const User = require('../models/User');
const Institution = require('../models/Institution');
const Department = require('../models/Department');
const Role = require('../models/Role');
const ActivityLog = require('../models/ActivityLog');
const AuditLog = require('../models/AuditLog');
const { sendEmail } = require('../utils/sendEmail');
const { ALL_PERMISSIONS, SYSTEM_ROLE_PERMISSIONS, checkPermissionDelegation } = require('../utils/permissions');

// Default in-memory platform system configuration fallback
let globalSystemConfig = {
  platformName: 'MAVI Linking',
  maintenanceMode: false,
  allowSelfRegistration: true,
  requirePrnVerification: true,
  maxTenantLimit: 50,
  defaultSessionTimeoutMinutes: 60,
  enforceMfaForAdmins: false,
  updatedAt: new Date().toISOString(),
};

/**
 * @desc    Get Platform Owner Overview & Master System Metrics
 * @route   GET /api/owner/overview
 * @access  Private (Platform Owner)
 */
const getOwnerOverview = async (req, res, next) => {
  try {
    const [
      institutionsCount,
      activeInstitutionsCount,
      adminsCount,
      usersCount,
      studentsCount,
      teachersCount,
      recruitersCount,
      securityLogsCount,
      recentTenants,
      recentSecurityEvents,
    ] = await Promise.all([
      Institution.countDocuments({ status: { $ne: 'deleted' } }),
      Institution.countDocuments({ status: 'active' }),
      User.countDocuments({ role: { $in: ['institution_admin', 'admin'] } }),
      User.countDocuments(),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'recruiter' }),
      ActivityLog.countDocuments(),
      Institution.find().sort({ createdAt: -1 }).limit(5),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'name email role maviId'),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalInstitutions: institutionsCount,
          activeInstitutions: activeInstitutionsCount,
          totalAdmins: adminsCount,
          totalUsers: usersCount,
          totalStudents: studentsCount,
          totalTeachers: teachersCount,
          totalRecruiters: recruitersCount,
          activeSubscriptions: activeInstitutionsCount,
          totalSecurityEvents: securityLogsCount,
        },
        recentTenants,
        recentSecurityEvents,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all Tenants / Institutions with filters
 * @route   GET /api/owner/tenants
 * @access  Private (Platform Owner)
 */
const getTenants = async (req, res, next) => {
  try {
    const { search, status, plan } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status.toLowerCase();
    }
    if (plan && plan !== 'all') {
      filter.plan = plan.toUpperCase();
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortName: { $regex: search, $options: 'i' } },
        { tenantId: { $regex: search, $options: 'i' } },
        { officialDomain: { $regex: search, $options: 'i' } },
      ];
    }

    const institutions = await Institution.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: institutions.length,
      data: { institutions },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Provision a new Tenant / Institution
 * @route   POST /api/owner/tenants
 * @access  Private (Platform Owner)
 */
const createTenant = async (req, res, next) => {
  try {
    const { name, shortName, officialDomain, plan, primaryContactName, primaryContactEmail } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Institution name is required.' });
    }

    const existingInst = await Institution.findOne({
      $or: [
        { name: name.trim() },
        ...(officialDomain ? [{ officialDomain: officialDomain.toLowerCase().trim() }] : []),
      ],
    });

    if (existingInst) {
      return res.status(409).json({
        success: false,
        message: 'An institution with this name or domain already exists.',
      });
    }

    const codePrefix = (shortName || name.substring(0, 4)).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const generatedTenantId = `INST-${codePrefix.substring(0, 6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const institution = await Institution.create({
      name: name.trim(),
      shortName: (shortName || '').trim(),
      officialDomain: (officialDomain || '').toLowerCase().trim(),
      domain: (officialDomain || '').toLowerCase().trim(),
      tenantId: generatedTenantId,
      plan: plan || 'PRO',
      status: 'active',
      licenseStatus: 'active',
      subscriptionStatus: 'active',
      primaryContact: {
        name: primaryContactName || '',
        email: primaryContactEmail || '',
      },
      createdBy: req.user._id,
    });

    await ActivityLog.create({
      userId: req.user._id,
      action: 'PROVISION_TENANT',
      details: `Provisioned new tenant institution: ${institution.name} (${institution.tenantId})`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(201).json({
      success: true,
      message: 'Institution provisioned successfully.',
      data: { institution },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Tenant Status or Plan
 * @route   PUT /api/owner/tenants/:id
 * @access  Private (Platform Owner)
 */
const updateTenant = async (req, res, next) => {
  try {
    const { status, plan, licenseStatus, subscriptionStatus } = req.body;
    const institution = await Institution.findById(req.params.id);

    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    if (status) institution.status = status;
    if (plan) institution.plan = plan;
    if (licenseStatus) institution.licenseStatus = licenseStatus;
    if (subscriptionStatus) institution.subscriptionStatus = subscriptionStatus;

    await institution.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: 'UPDATE_TENANT',
      details: `Updated tenant ${institution.name} (${institution.tenantId}). Status: ${institution.status}, Plan: ${institution.plan}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: 'Tenant updated successfully.',
      data: { institution },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all available system permissions
 * @route   GET /api/owner/permissions
 * @access  Private (Platform Owner / Super Admin)
 */
const getPermissions = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        permissions: ALL_PERMISSIONS,
        systemRoles: Object.keys(SYSTEM_ROLE_PERMISSIONS),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get system and custom roles
 * @route   GET /api/owner/roles
 * @access  Private (Platform Owner / Super Admin)
 */
const getRoles = async (req, res, next) => {
  try {
    const customRoles = await Role.find().sort({ createdAt: -1 });

    const systemRoles = Object.keys(SYSTEM_ROLE_PERMISSIONS).map((code) => ({
      code,
      name: code.replace(/_/g, ' ').toUpperCase(),
      isSystemRole: true,
      permissions: SYSTEM_ROLE_PERMISSIONS[code],
      scope: code === 'super_admin' || code === 'platform_owner' ? 'PLATFORM' : code === 'department_admin' ? 'DEPARTMENT' : 'INSTITUTION',
    }));

    res.status(200).json({
      success: true,
      data: {
        systemRoles,
        customRoles,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a Custom Administrative Role
 * @route   POST /api/owner/roles
 * @access  Private (Platform Owner / Super Admin)
 */
const createCustomRole = async (req, res, next) => {
  try {
    const { name, code, description, scope, institutionId, permissions } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Role name and role code are required.' });
    }

    const formattedCode = code.toUpperCase().trim().replace(/[^A_Z0-9_]/g, '_');

    // Prevent overwriting built-in system role codes
    if (SYSTEM_ROLE_PERMISSIONS[formattedCode.toLowerCase()]) {
      return res.status(400).json({ success: false, message: 'Cannot override built-in system role codes.' });
    }

    const existingRole = await Role.findOne({ code: formattedCode });
    if (existingRole) {
      return res.status(409).json({ success: false, message: `Role code "${formattedCode}" already exists.` });
    }

    const role = await Role.create({
      name: name.trim(),
      code: formattedCode,
      description: description || '',
      scope: scope || 'INSTITUTION',
      institutionId: institutionId || null,
      permissions: Array.isArray(permissions) ? permissions : [],
      isSystemRole: false,
      createdBy: req.user._id,
    });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'ADMIN_ROLE_CHANGED',
      details: `Created custom admin role: ${role.name} (${role.code})`,
      result: 'SUCCESS',
    });

    res.status(201).json({
      success: true,
      message: 'Custom administrative role created successfully.',
      data: { role },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Custom Administrative Role
 * @route   PUT /api/owner/roles/:id
 * @access  Private (Platform Owner / Super Admin)
 */
const updateCustomRole = async (req, res, next) => {
  try {
    const { name, description, scope, permissions } = req.body;
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ success: false, message: 'Custom role not found.' });
    }

    if (role.isSystemRole) {
      return res.status(400).json({ success: false, message: 'System built-in roles cannot be modified directly.' });
    }

    if (name) role.name = name.trim();
    if (description !== undefined) role.description = description;
    if (scope) role.scope = scope;
    if (Array.isArray(permissions)) role.permissions = permissions;

    await role.save();

    res.status(200).json({
      success: true,
      message: 'Custom administrative role updated successfully.',
      data: { role },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Custom Administrative Role
 * @route   DELETE /api/owner/roles/:id
 * @access  Private (Platform Owner / Super Admin)
 */
const deleteCustomRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }

    if (role.isSystemRole) {
      return res.status(400).json({ success: false, message: 'System built-in roles cannot be deleted.' });
    }

    await Role.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Custom administrative role deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all Administrators with filtering (Owner & Admin View)
 * @route   GET /api/owner/admins
 * @access  Private (Platform Owner / Super Admin / Admin)
 */
const getAdmins = async (req, res, next) => {
  try {
    const { search, institutionId, role, scope, status } = req.query;
    const filter = {
      role: { $in: ['institution_admin', 'department_admin', 'admin', 'placement_admin', 'academic_admin', 'super_admin'] },
    };

    if (institutionId && institutionId !== 'all') {
      filter.institutionId = institutionId;
    }
    if (role && role !== 'all') {
      filter.role = role.toLowerCase();
    }
    if (scope && scope !== 'all') {
      filter.adminScope = scope.toUpperCase();
    }
    if (status && status !== 'all') {
      filter.accountStatus = status.toUpperCase();
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { adminId: searchRegex },
        { maviId: searchRegex },
      ];
    }

    const admins = await User.find(filter)
      .populate('institutionId', 'name tenantId shortName domain')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admins.length,
      data: { admins },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Invite Administrator with custom role, scope & permissions
 * @route   POST /api/owner/admins/invite
 * @access  Private (Owner / Super Admin / Admin with ADMIN_CREATE)
 */
const inviteAdmin = async (req, res, next) => {
  try {
    const {
      name,
      email,
      institutionId,
      departmentId,
      role = 'institution_admin',
      scope = 'INSTITUTION',
      permissions = [],
      designation,
      adminId,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Administrator name and email address are required.',
      });
    }

    const lowerEmail = email.toLowerCase().trim();

    // 1. Scope & Institution Validation
    let targetInst = null;
    if (scope !== 'PLATFORM') {
      if (!institutionId) {
        return res.status(400).json({ success: false, message: 'Target institution is required for INSTITUTION or DEPARTMENT scope.' });
      }
      targetInst = await Institution.findById(institutionId);
      if (!targetInst) {
        return res.status(404).json({ success: false, message: 'Target institution not found.' });
      }
    }

    // 2. Department Scoping Validation
    let targetDept = null;
    if (scope === 'DEPARTMENT') {
      if (!departmentId) {
        return res.status(400).json({ success: false, message: 'Department selection is required for DEPARTMENT scope.' });
      }
      targetDept = await Department.findById(departmentId);
      if (!targetDept) {
        return res.status(404).json({ success: false, message: 'Target department not found.' });
      }
      if (targetDept.institutionId.toString() !== targetInst._id.toString()) {
        return res.status(400).json({
          success: false,
          code: 'DEPARTMENT_INSTITUTION_MISMATCH',
          message: 'Selected department does not belong to the chosen institution.',
        });
      }
    }

    // 3. Super Admin Protection & Permission Escalation Safeguard
    const isActorSuper =
      req.user.role === 'super_admin' ||
      req.user.role === 'platform_owner' ||
      (Array.isArray(req.user.roles) && (req.user.roles.includes('super_admin') || req.user.roles.includes('platform_owner')));

    if (role === 'super_admin' || role === 'platform_owner') {
      if (!isActorSuper) {
        return res.status(403).json({
          success: false,
          code: 'SUPER_ADMIN_CREATION_DENIED',
          message: 'Forbidden. Ordinary admins cannot create Super Admin accounts.',
        });
      }
    }

    // Check permission delegation
    if (!checkPermissionDelegation(req.user, permissions)) {
      return res.status(403).json({
        success: false,
        code: 'PERMISSION_DELEGATION_DENIED',
        message: 'You cannot grant administrative permissions that you yourself do not possess.',
      });
    }

    // 4. Generate Single-Use Token & Identifiers
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpires = new Date(Date.now() + 48 * 3600 * 1000); // 48 Hours
    const customAdminId = adminId || `ADM-${targetInst?.shortName || 'PLAT'}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    let existingUser = await User.findOne({ email: lowerEmail });

    if (existingUser) {
      existingUser.role = role;
      existingUser.roles = Array.from(new Set([...(existingUser.roles || []), role, 'user']));
      existingUser.adminScope = scope;
      existingUser.adminScopeDetails = {
        scope,
        institutionId: targetInst ? targetInst._id : null,
        departmentId: targetDept ? targetDept._id : null,
      };
      existingUser.institutionId = targetInst ? targetInst._id : null;
      existingUser.departmentId = targetDept ? targetDept._id : null;
      existingUser.tenantId = targetInst ? targetInst.tenantId : '';
      existingUser.adminId = customAdminId;
      existingUser.adminLoginId = customAdminId;
      existingUser.designation = designation || existingUser.designation || 'Administrator';
      existingUser.permissions = permissions;
      existingUser.invitationToken = inviteToken;
      existingUser.invitationExpires = inviteExpires;
      existingUser.invitedBy = req.user._id;
      existingUser.invitedAt = new Date();
      existingUser.accountStatus = 'INVITED';
      await existingUser.save();
    } else {
      existingUser = await User.create({
        name: name.trim(),
        email: lowerEmail,
        password: crypto.randomBytes(16).toString('hex'), // Temporary Hash until setup
        role,
        roles: [role, 'user'],
        adminScope: scope,
        adminScopeDetails: {
          scope,
          institutionId: targetInst ? targetInst._id : null,
          departmentId: targetDept ? targetDept._id : null,
        },
        institutionId: targetInst ? targetInst._id : null,
        departmentId: targetDept ? targetDept._id : null,
        tenantId: targetInst ? targetInst.tenantId : '',
        adminId: customAdminId,
        adminLoginId: customAdminId,
        designation: designation || 'Administrator',
        permissions,
        mustChangePassword: true,
        invitationToken: inviteToken,
        invitationExpires: inviteExpires,
        invitedBy: req.user._id,
        invitedAt: new Date(),
        accountStatus: 'INVITED',
        status: 'active',
      });
    }

    // 5. Send Invitation Email
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const invitationLink = `${clientUrl}/admin/accept-invite?token=${inviteToken}`;

    try {
      await sendEmail({
        to: lowerEmail,
        subject: `You've been invited to administer MAVI Linking`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #6366f1;">MAVI Linking — Administrative Invitation</h2>
            <p>Hello <strong>${existingUser.name}</strong>,</p>
            <p>You have been invited to join <strong>MAVI Linking</strong> as an administrator.</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Role:</strong> ${role.replace(/_/g, ' ').toUpperCase()}</p>
              <p><strong>Management Scope:</strong> ${scope}</p>
              <p><strong>Institution:</strong> ${targetInst ? targetInst.name : 'Platform Wide'}</p>
              ${targetDept ? `<p><strong>Department:</strong> ${targetDept.name}</p>` : ''}
            </div>
            <p>Please click the button below to accept your invitation and create your password:</p>
            <a href="${invitationLink}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Accept Invitation</a>
            <p style="margin-top: 20px; font-size: 0.85em; color: #666;">This invitation link is valid for 48 hours.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('[INVITATION EMAIL DISPATCH NON-FATAL ERROR]', emailErr.message);
    }

    // Audit Logging
    await AuditLog.create({
      actorId: req.user._id,
      targetUserId: existingUser._id,
      action: 'ADMIN_INVITATION_SENT',
      institutionId: targetInst ? targetInst._id : null,
      departmentId: targetDept ? targetDept._id : null,
      details: { role, scope, permissions },
      result: 'SUCCESS',
    });

    res.status(201).json({
      success: true,
      message: 'Administrator invitation created and email dispatched successfully.',
      data: {
        admin: existingUser,
        invitationLink,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Edit Administrator Role, Scope, Department & Permissions
 * @route   PUT /api/owner/admins/:id
 * @access  Private (Owner / Super Admin / Authorized Admin)
 */
const updateAdmin = async (req, res, next) => {
  try {
    const { role, scope, institutionId, departmentId, permissions, designation } = req.body;
    const adminUser = await User.findById(req.params.id);

    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Administrator account not found.' });
    }

    // Permission delegation safeguard
    if (permissions && !checkPermissionDelegation(req.user, permissions)) {
      return res.status(403).json({
        success: false,
        code: 'PERMISSION_DELEGATION_DENIED',
        message: 'You cannot grant permissions that you yourself do not possess.',
      });
    }

    if (role) adminUser.role = role;
    if (scope) adminUser.adminScope = scope;
    if (designation !== undefined) adminUser.designation = designation;
    if (Array.isArray(permissions)) adminUser.permissions = permissions;

    if (institutionId) {
      adminUser.institutionId = institutionId;
    }
    if (departmentId !== undefined) {
      adminUser.departmentId = departmentId || null;
    }

    adminUser.adminScopeDetails = {
      scope: scope || adminUser.adminScope,
      institutionId: adminUser.institutionId,
      departmentId: adminUser.departmentId,
    };

    await adminUser.save();

    await AuditLog.create({
      actorId: req.user._id,
      targetUserId: adminUser._id,
      action: 'ADMIN_ROLE_CHANGED',
      institutionId: adminUser.institutionId,
      details: { role: adminUser.role, scope: adminUser.adminScope, permissions: adminUser.permissions },
      result: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: 'Administrator settings updated successfully.',
      data: { admin: adminUser },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Suspend Administrator Account
 * @route   PATCH /api/owner/admins/:id/suspend
 * @access  Private (Owner / Super Admin / Authorized Admin)
 */
const suspendAdmin = async (req, res, next) => {
  try {
    const { reason = 'Account suspended by administrator.' } = req.body;
    const adminUser = await User.findById(req.params.id);

    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    adminUser.accountStatus = 'SUSPENDED';
    adminUser.status = 'suspended';
    adminUser.suspendedBy = req.user._id;
    adminUser.suspendedAt = new Date();
    adminUser.suspensionReason = reason.trim();
    await adminUser.save();

    await AuditLog.create({
      actorId: req.user._id,
      targetUserId: adminUser._id,
      action: 'ADMIN_SUSPENDED',
      institutionId: adminUser.institutionId,
      details: { reason },
      result: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: 'Administrator account has been suspended.',
      data: { admin: adminUser },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reactivate Suspended Administrator Account
 * @route   PATCH /api/owner/admins/:id/reactivate
 * @access  Private (Owner / Super Admin / Authorized Admin)
 */
const reactivateAdmin = async (req, res, next) => {
  try {
    const adminUser = await User.findById(req.params.id);

    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    adminUser.accountStatus = 'ACTIVE';
    adminUser.status = 'active';
    adminUser.suspendedBy = null;
    adminUser.suspendedAt = null;
    adminUser.suspensionReason = '';
    await adminUser.save();

    await AuditLog.create({
      actorId: req.user._id,
      targetUserId: adminUser._id,
      action: 'ADMIN_REACTIVATED',
      institutionId: adminUser.institutionId,
      result: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: 'Administrator account reactivated successfully.',
      data: { admin: adminUser },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend Admin Invitation
 * @route   POST /api/owner/admins/:id/resend-invite
 * @access  Private (Owner / Super Admin)
 */
const resendAdminInvite = async (req, res, next) => {
  try {
    const adminUser = await User.findById(req.params.id).populate('institutionId', 'name');

    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    adminUser.invitationToken = inviteToken;
    adminUser.invitationExpires = new Date(Date.now() + 48 * 3600 * 1000);
    adminUser.accountStatus = 'INVITED';
    await adminUser.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const invitationLink = `${clientUrl}/admin/accept-invite?token=${inviteToken}`;

    await sendEmail({
      email: adminUser.email,
      subject: `MAVI Linking — Resent Administrative Invitation`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #6366f1;">MAVI Linking — Administrative Invitation</h2>
          <p>Hello <strong>${adminUser.name}</strong>,</p>
          <p>Your administrative invitation for MAVI Linking has been resent.</p>
          <a href="${invitationLink}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Accept Invitation</a>
        </div>
      `,
    }).catch((err) => console.error('[RESEND EMAIL ERROR]', err.message));

    res.status(200).json({
      success: true,
      message: 'Invitation resent successfully.',
      data: { invitationLink },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Revoke Pending Admin Invitation
 * @route   PATCH /api/owner/admins/:id/revoke-invite
 * @access  Private (Owner / Super Admin)
 */
const revokeAdminInvite = async (req, res, next) => {
  try {
    const adminUser = await User.findById(req.params.id);

    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    adminUser.invitationToken = null;
    adminUser.invitationExpires = null;
    adminUser.accountStatus = 'INVITATION_REVOKED';
    await adminUser.save();

    await AuditLog.create({
      actorId: req.user._id,
      targetUserId: adminUser._id,
      action: 'ADMIN_INVITATION_REVOKED',
      result: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: 'Administrator invitation revoked successfully.',
      data: { admin: adminUser },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle Admin Account Status (Legacy Compatibility)
 * @route   PUT /api/owner/admins/:id/status
 * @access  Private (Platform Owner)
 */
const toggleAdminStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const adminUser = await User.findById(req.params.id);

    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    adminUser.status = status || (adminUser.status === 'active' ? 'suspended' : 'active');
    if (adminUser.status === 'suspended') {
      adminUser.accountStatus = 'SUSPENDED';
    } else if (adminUser.accountStatus === 'SUSPENDED') {
      adminUser.accountStatus = 'ACTIVE';
    }
    await adminUser.save();

    res.status(200).json({
      success: true,
      message: `Admin account ${adminUser.status === 'active' ? 'activated' : 'suspended'}.`,
      data: { admin: adminUser },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Platform Users (Students, Teachers, Recruiters, Admins)
 * @route   GET /api/owner/users
 * @access  Private (Platform Owner)
 */
const getUsers = async (req, res, next) => {
  try {
    const { search, role, status } = req.query;
    const filter = {};

    if (role && role !== 'all') {
      filter.role = role === 'student' ? 'user' : role;
    }
    if (status && status !== 'all') {
      filter.status = status.toLowerCase();
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { maviId: { $regex: search, $options: 'i' } },
        { prn: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password -refreshToken')
      .populate('institutionId', 'name tenantId shortName')
      .sort({ createdAt: -1 })
      .limit(200);

    res.status(200).json({
      success: true,
      count: users.length,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle User Account Status (Activate/Suspend)
 * @route   PUT /api/owner/users/:id/status
 * @access  Private (Platform Owner)
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    targetUser.status = status || (targetUser.status === 'active' ? 'suspended' : 'active');
    await targetUser.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: 'TOGGLE_USER_STATUS',
      details: `Updated user ${targetUser.email} status to ${targetUser.status}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: `User account ${targetUser.status === 'active' ? 'activated' : 'suspended'}.`,
      data: { user: targetUser },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Licensing Overview & Tenant Licenses
 * @route   GET /api/owner/licensing
 * @access  Private (Platform Owner)
 */
const getLicensing = async (req, res, next) => {
  try {
    const institutions = await Institution.find().sort({ createdAt: -1 });

    const licenses = institutions.map((inst) => ({
      _id: inst._id,
      tenantId: inst.tenantId,
      institutionName: inst.name,
      officialDomain: inst.officialDomain,
      plan: inst.plan || 'PRO',
      licenseStatus: inst.licenseStatus || 'active',
      startDate: inst.createdAt,
      userLimit: inst.plan === 'ENTERPRISE' ? 10000 : inst.plan === 'PRO' ? 2500 : 500,
    }));

    res.status(200).json({
      success: true,
      data: { licenses },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update License Status or Plan
 * @route   PUT /api/owner/licensing/:id
 * @access  Private (Platform Owner)
 */
const updateLicense = async (req, res, next) => {
  try {
    const { plan, licenseStatus } = req.body;
    const institution = await Institution.findById(req.params.id);

    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    if (plan) institution.plan = plan;
    if (licenseStatus) institution.licenseStatus = licenseStatus;
    await institution.save();

    res.status(200).json({
      success: true,
      message: 'License updated successfully.',
      data: { institution },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Subscriptions List & Details
 * @route   GET /api/owner/subscriptions
 * @access  Private (Platform Owner)
 */
const getSubscriptions = async (req, res, next) => {
  try {
    const institutions = await Institution.find().sort({ createdAt: -1 });

    const subscriptions = institutions.map((inst) => ({
      _id: inst._id,
      tenantId: inst.tenantId,
      institutionName: inst.name,
      plan: inst.plan || 'PRO',
      subscriptionStatus: inst.subscriptionStatus || 'active',
      billingCycle: 'Annual',
      startDate: inst.createdAt,
      renewalDate: new Date(new Date(inst.createdAt).setFullYear(new Date(inst.createdAt).getFullYear() + 1)),
      amount: inst.plan === 'ENTERPRISE' ? '$12,000/yr' : inst.plan === 'PRO' ? '$4,800/yr' : '$1,200/yr',
    }));

    res.status(200).json({
      success: true,
      data: { subscriptions },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Platform-Wide Global Analytics
 * @route   GET /api/owner/analytics
 * @access  Private (Platform Owner)
 */
const getPlatformAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalInstitutions,
      totalAdmins,
      studentsCount,
      teachersCount,
      recruitersCount,
    ] = await Promise.all([
      User.countDocuments(),
      Institution.countDocuments(),
      User.countDocuments({ role: { $in: ['institution_admin', 'admin'] } }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'recruiter' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        analytics: {
          totalUsers,
          totalInstitutions,
          totalAdmins,
          studentsCount,
          teachersCount,
          recruitersCount,
          roleDistribution: {
            students: studentsCount,
            teachers: teachersCount,
            recruiters: recruitersCount,
            admins: totalAdmins,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Security Center Events
 * @route   GET /api/owner/security-events
 * @access  Private (Platform Owner)
 */
const getSecurityEvents = async (req, res, next) => {
  try {
    const events = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'name email role maviId adminId');

    res.status(200).json({
      success: true,
      count: events.length,
      data: { events },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get System Configuration
 * @route   GET /api/owner/configuration
 * @access  Private (Platform Owner)
 */
const getSystemConfig = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: { configuration: globalSystemConfig },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update System Configuration
 * @route   PUT /api/owner/configuration
 * @access  Private (Platform Owner)
 */
const updateSystemConfig = async (req, res, next) => {
  try {
    const {
      platformName,
      maintenanceMode,
      allowSelfRegistration,
      requirePrnVerification,
      maxTenantLimit,
      defaultSessionTimeoutMinutes,
    } = req.body;

    if (platformName !== undefined) globalSystemConfig.platformName = platformName;
    if (maintenanceMode !== undefined) globalSystemConfig.maintenanceMode = Boolean(maintenanceMode);
    if (allowSelfRegistration !== undefined) globalSystemConfig.allowSelfRegistration = Boolean(allowSelfRegistration);
    if (requirePrnVerification !== undefined) globalSystemConfig.requirePrnVerification = Boolean(requirePrnVerification);
    if (maxTenantLimit !== undefined) globalSystemConfig.maxTenantLimit = Number(maxTenantLimit);
    if (defaultSessionTimeoutMinutes !== undefined) globalSystemConfig.defaultSessionTimeoutMinutes = Number(defaultSessionTimeoutMinutes);

    globalSystemConfig.updatedAt = new Date().toISOString();

    await ActivityLog.create({
      userId: req.user._id,
      action: 'UPDATE_SYSTEM_CONFIG',
      details: `Updated platform global system configuration`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: 'System configuration updated successfully.',
      data: { configuration: globalSystemConfig },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Global Security Audit Logs
 * @route   GET /api/owner/audit-logs
 * @access  Private (Platform Owner)
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { action: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } },
      ];
    }

    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('userId', 'name email role maviId adminId');

    res.status(200).json({
      success: true,
      count: logs.length,
      data: { logs },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
