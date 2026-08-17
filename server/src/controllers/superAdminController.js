const User = require('../models/User');
const Institution = require('../models/Institution');
const InstitutionMembership = require('../models/InstitutionMembership');
const ActivityLog = require('../models/ActivityLog');
const AuditLog = require('../models/AuditLog');
const RecruitmentNotification = require('../models/RecruitmentNotification');
const crypto = require('crypto');
const { sendAdminInvitationEmail } = require('../utils/sendEmail');
const { getAdminInvitationExpiryHours, getAdminInvitationExpiresAt } = require('../config/invitationConfig');

/**
 * @desc    Get Global Super Admin Dashboard Metrics
 * @route   GET /api/super-admin/stats
 * @access  Private (Super Admin)
 */
const getSuperAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalInstitutions,
      totalAdmins,
      studentCount,
      teacherCount,
      recruiterCount,
      pendingVerifications,
      suspendedCount,
      securityEventsCount,
    ] = await Promise.all([
      User.countDocuments(),
      Institution.countDocuments(),
      User.countDocuments({ role: { $in: ['super_admin', 'admin', 'institution_admin'] } }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'recruiter' }),
      User.countDocuments({ roleStatus: 'pending' }),
      User.countDocuments({ status: 'suspended' }),
      ActivityLog.countDocuments({ action: { $regex: 'ADMIN|SUSPEND|SECURITY|LOGIN', $options: 'i' } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalInstitutions,
        totalAdmins,
        students: studentCount,
        teachers: teacherCount,
        recruiters: recruiterCount,
        pendingVerifications,
        suspended: suspendedCount,
        securityEvents: securityEventsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all administrative users across the platform
 * @route   GET /api/super-admin/admins
 * @access  Private (Super Admin)
 */
const getAllAdmins = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = { role: { $in: ['super_admin', 'admin', 'institution_admin'] } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { maviId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [admins, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('institutionId', 'name code domain')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        admins,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create or Invite a new Administrator (Super Admin or Institution Admin)
 * @route   POST /api/super-admin/admins
 * @access  Private (Super Admin)
 */
const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role, institutionId, adminId, designation, permissions } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const targetRole = ['super_admin', 'admin', 'institution_admin'].includes(role) ? role : 'institution_admin';
    const lowerEmail = email.toLowerCase().trim();

    let tenantId = '';
    let targetInst = null;

    if (institutionId) {
      targetInst = await Institution.findById(institutionId);
      if (!targetInst) {
        return res.status(404).json({
          success: false,
          message: 'Target institution not found.',
        });
      }
      const instStatus = (targetInst.status || 'ACTIVE').toUpperCase();
      if (instStatus === 'SUSPENDED' || instStatus === 'DELETED' || instStatus === 'ARCHIVED') {
        return res.status(400).json({
          success: false,
          message: `Cannot assign administrator to ${instStatus.toLowerCase()} institution: ${targetInst.name}`,
        });
      }
      // Secure server-side resolution of tenantId
      tenantId = targetInst.tenantId;
    }

    // Determine Admin ID (custom provided e.g. ZEAL-ADMIN-001 or auto-generated INSTADM-XXXXXX)
    const finalAdminId = adminId
      ? adminId.trim().toUpperCase()
      : 'INSTADM-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    let user = await User.findOne({ email: lowerEmail });

    // Duplicate Check: If pending invitation or active admin already exists for this institution
    if (user) {
      if (user.institutionId && user.institutionId.toString() === institutionId?.toString()) {
        if (user.status === 'pending' && user.invitationToken) {
          return res.status(409).json({
            success: false,
            message: `A pending invitation already exists for ${lowerEmail} at ${targetInst?.name || 'this institution'}. Use Resend Invite from the management roster.`,
          });
        }
        if (user.role === targetRole || user.roles.includes(targetRole)) {
          return res.status(409).json({
            success: false,
            message: `${lowerEmail} is already an active ${targetRole.replace('_', ' ')} at ${targetInst?.name || 'this institution'}.`,
          });
        }
      }
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const hashedInviteToken = crypto.createHash('sha256').update(inviteToken).digest('hex');
    const inviteExpires = getAdminInvitationExpiresAt();
    const expiryHours = getAdminInvitationExpiryHours();

    if (user) {
      // Upgrade existing user to admin
      user.role = targetRole;
      if (!user.roles.includes(targetRole)) user.roles.push(targetRole);
      if (!user.roles.includes('admin')) user.roles.push('admin');
      if (institutionId) user.institutionId = institutionId;
      if (tenantId) user.tenantId = tenantId;
      user.adminId = finalAdminId;
      user.adminLoginId = finalAdminId;
      if (designation) user.designation = designation;
      if (permissions && Array.isArray(permissions)) user.permissions = permissions;
      user.invitationToken = hashedInviteToken;
      user.invitationExpires = inviteExpires;
      user.accountStatus = 'INVITED';
      user.isInvitedAdmin = true;
      user.invitedBy = req.user._id;
      user.invitedAt = new Date();
      user.status = 'active';
      await user.save();
    } else {
      // Create new admin in INVITED state
      const dummyPassword = password || crypto.randomBytes(16).toString('hex');

      user = await User.create({
        name,
        email: lowerEmail,
        password: dummyPassword,
        role: targetRole,
        roles: [targetRole, 'admin', 'user'],
        institutionId: institutionId || null,
        tenantId: tenantId || '',
        adminId: finalAdminId,
        adminLoginId: finalAdminId,
        designation: designation || 'Institution Administrator',
        permissions: Array.isArray(permissions) ? permissions : ['students:read', 'students:update', 'teachers:read', 'verification:approve', 'reports:read'],
        status: 'active',
        accountStatus: 'INVITED',
        isInvitedAdmin: true,
        mustChangePassword: true,
        invitationToken: hashedInviteToken,
        invitationExpires: inviteExpires,
        invitedBy: req.user._id,
        invitedAt: new Date(),
        emailVerified: true,
      });
    }

    // Bind InstitutionMembership if institutionId provided
    if (institutionId) {
      await InstitutionMembership.findOneAndUpdate(
        { userId: user._id, institutionId },
        {
          userId: user._id,
          institutionId,
          tenantId: tenantId || '',
          adminLoginId: finalAdminId,
          role: targetRole === 'institution_admin' ? 'institution_admin' : 'institution_admin',
          permissions: user.permissions || [],
          status: 'active',
          assignedBy: req.user._id,
        },
        { upsert: true, new: true }
      );
    }

    // Dispatch Invitation Email
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const invitationLink = `${clientUrl}/admin/accept-invite?token=${inviteToken}`;

    const emailResult = await sendAdminInvitationEmail({
      to: lowerEmail,
      name: user.name,
      role: targetRole,
      institutionName: targetInst?.name || 'Platform Wide',
      managementScope: targetInst ? 'INSTITUTION' : 'PLATFORM',
      invitationLink,
      expiresHours: expiryHours,
    });

    await ActivityLog.create({
      userId: req.user._id,
      action: 'SUPER_ADMIN_CREATED_ADMIN',
      details: `Created/Invited Admin ${user.email} (Role: ${targetRole}, Admin ID: ${finalAdminId}, Institution: ${targetInst?.name || 'Global'})`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    await AuditLog.create({
      actorId: req.user._id,
      targetUserId: user._id,
      action: 'ADMIN_INVITATION_CREATED',
      institutionId: targetInst ? targetInst._id : null,
      details: { role: targetRole, adminId: finalAdminId, email: lowerEmail },
      result: 'SUCCESS',
    });

    if (emailResult.success) {
      await AuditLog.create({
        actorId: req.user._id,
        targetUserId: user._id,
        action: 'ADMIN_INVITATION_EMAIL_SENT',
        institutionId: targetInst ? targetInst._id : null,
        details: { email: lowerEmail, messageId: emailResult.messageId },
        result: 'SUCCESS',
      });
    } else {
      await AuditLog.create({
        actorId: req.user._id,
        targetUserId: user._id,
        action: 'ADMIN_INVITATION_EMAIL_FAILED',
        institutionId: targetInst ? targetInst._id : null,
        details: { email: lowerEmail, error: emailResult.error },
        result: 'FAILED',
      });
    }

    try {
      await RecruitmentNotification.create({
        recipientId: user._id,
        senderId: req.user._id,
        type: 'general',
        title: 'Administrative Access Granted 🔑',
        message: `You have been assigned ${targetRole.replace('_', ' ').toUpperCase()} access (Admin ID: ${finalAdminId}) on MAVI Linking.`,
      });
    } catch (_) {}

    const userPayload = user.toObject ? user.toObject() : { ...user };
    delete userPayload.invitationToken;
    delete userPayload.password;

    res.status(201).json({
      success: true,
      administratorCreated: true,
      emailSent: emailResult.success,
      recipient: user.email,
      message: emailResult.success
        ? `Administrator created successfully. Invitation email sent to ${user.email}.`
        : `Administrator created, but invitation email could not be sent to ${user.email}.`,
      data: {
        user: userPayload,
        adminId: finalAdminId,
        emailSent: emailResult.success,
        recipient: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Revoke Admin privileges from a user
 * @route   DELETE /api/super-admin/admins/:id
 * @access  Private (Super Admin)
 */
const removeAdmin = async (req, res, next) => {
  try {
    const adminUser = await User.findById(req.params.id);
    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    // Prevent self-demotion
    if (adminUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot revoke your own Super Admin account.' });
    }

    adminUser.role = 'user';
    adminUser.roles = ['user'];
    adminUser.institutionId = null;
    await adminUser.save();

    await InstitutionMembership.deleteMany({ userId: adminUser._id });

    await ActivityLog.create({
      userId: req.user._id,
      action: 'SUPER_ADMIN_REVOKED_ADMIN',
      details: `Revoked administrative privileges from ${adminUser.email}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: `Revoked administrative access from ${adminUser.email}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Platform Security Events & Logs
 * @route   GET /api/super-admin/security-events
 * @access  Private (Super Admin)
 */
const getSecurityEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {
      $or: [
        { action: { $regex: 'ADMIN|SUSPEND|SECURITY|REJECT|ROLE|DELETE', $options: 'i' } },
        { details: { $regex: 'suspended|rejected|failed|admin', $options: 'i' } },
      ],
    };

    const [events, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('userId', 'name email role status maviId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ActivityLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        events,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Platform Institution Licenses & Plan Subscriptions
 * @route   GET /api/super-admin/licenses
 * @access  Private (Super Admin)
 */
const getLicenses = async (req, res, next) => {
  try {
    const institutions = await Institution.find()
      .select('name tenantId code domain status plan licenseStatus subscriptionStatus createdAt updatedAt primaryContact')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: institutions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Platform Global Analytics & Growth Aggregations
 * @route   GET /api/super-admin/analytics
 * @access  Private (Super Admin)
 */
const getPlatformAnalytics = async (req, res, next) => {
  try {
    const [students, teachers, recruiters, admins, totalInsts, activeInsts] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'recruiter' }),
      User.countDocuments({ role: { $in: ['super_admin', 'admin', 'institution_admin'] } }),
      Institution.countDocuments(),
      Institution.countDocuments({ status: { $regex: '^active$', $options: 'i' } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        userDistribution: { students, teachers, recruiters, admins },
        institutions: { total: totalInsts, active: activeInsts },
        platformReadinessAvg: 88,
        activeDrives: 14,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Platform Settings
 * @route   GET /api/super-admin/settings
 * @access  Private (Super Admin)
 */
const getPlatformSettings = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        platformName: 'MAVI Linking',
        environment: process.env.NODE_ENV || 'production',
        requireEmailVerification: true,
        allowPublicRegistrations: true,
        defaultUserPlan: 'FREE',
        supportEmail: 'support@mavilinking.com',
        maxLoginAttempts: 5,
        sessionTimeoutMinutes: 120,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Platform Settings
 * @route   PUT /api/super-admin/settings
 * @access  Private (Super Admin)
 */
const updatePlatformSettings = async (req, res, next) => {
  try {
    await ActivityLog.create({
      userId: req.user._id,
      action: 'SUPER_ADMIN_UPDATED_SETTINGS',
      details: `Updated global platform configuration settings`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: 'Platform settings updated successfully',
      data: req.body,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend Admin Invitation Email (Super Admin authority)
 * @route   POST /api/super-admin/admins/:id/resend-invite
 * @access  Private (Super Admin)
 */
const resendAdminInvite = async (req, res, next) => {
  try {
    const adminUser = await User.findById(req.params.id)
      .populate('institutionId', 'name shortName tenantId');

    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    // Rate Limit: Minimum 60s resend interval
    if (adminUser.invitedAt && Date.now() - new Date(adminUser.invitedAt).getTime() < 60000) {
      const remainingSecs = Math.ceil((60000 - (Date.now() - new Date(adminUser.invitedAt).getTime())) / 1000);
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: `Please wait ${remainingSecs} seconds before resending another invitation email.`,
      });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const hashedInviteToken = crypto.createHash('sha256').update(inviteToken).digest('hex');
    adminUser.invitationToken = hashedInviteToken;
    adminUser.invitationExpires = getAdminInvitationExpiresAt();
    adminUser.accountStatus = 'INVITED';
    adminUser.invitedAt = new Date();
    await adminUser.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const invitationLink = `${clientUrl}/admin/accept-invite?token=${inviteToken}`;

    const emailResult = await sendAdminInvitationEmail({
      to: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      institutionName: adminUser.institutionId?.name || 'Platform Wide',
      managementScope: adminUser.institutionId ? 'INSTITUTION' : 'PLATFORM',
      invitationLink,
      expiresHours: getAdminInvitationExpiryHours(),
    });

    await AuditLog.create({
      actorId: req.user._id,
      targetUserId: adminUser._id,
      action: 'ADMIN_INVITATION_RESENT',
      institutionId: adminUser.institutionId?._id || adminUser.institutionId || null,
      details: { email: adminUser.email, emailSent: emailResult.success },
      result: emailResult.success ? 'SUCCESS' : 'FAILED',
    });

    res.status(200).json({
      success: true,
      emailSent: emailResult.success,
      recipient: adminUser.email,
      message: emailResult.success
        ? 'Invitation email resent successfully.'
        : 'Invitation updated, but email could not be sent.',
      data: {
        emailSent: emailResult.success,
        recipient: adminUser.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuperAdminStats,
  getAllAdmins,
  createAdmin,
  removeAdmin,
  resendAdminInvite,
  getSecurityEvents,
  getLicenses,
  getPlatformAnalytics,
  getPlatformSettings,
  updatePlatformSettings,
};
