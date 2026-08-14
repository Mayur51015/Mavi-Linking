const crypto = require('crypto');
const User = require('../models/User');
const Institution = require('../models/Institution');
const ActivityLog = require('../models/ActivityLog');

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
 * @desc    Get all Institution Admins
 * @route   GET /api/owner/admins
 * @access  Private (Platform Owner)
 */
const getAdmins = async (req, res, next) => {
  try {
    const { search, institutionId } = req.query;
    const filter = { role: { $in: ['institution_admin', 'admin'] } };

    if (institutionId && institutionId !== 'all') {
      filter.institutionId = institutionId;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { adminId: { $regex: search, $options: 'i' } },
        { maviId: { $regex: search, $options: 'i' } },
      ];
    }

    const admins = await User.find(filter)
      .populate('institutionId', 'name tenantId shortName domain')
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
 * @desc    Invite Institution Administrator
 * @route   POST /api/owner/admins/invite
 * @access  Private (Platform Owner)
 */
const inviteAdmin = async (req, res, next) => {
  try {
    const { name, email, institutionId, designation, adminId } = req.body;

    if (!name || !email || !institutionId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and target institution are required.',
      });
    }

    const targetInst = await Institution.findById(institutionId);
    if (!targetInst) {
      return res.status(404).json({ success: false, message: 'Target institution not found.' });
    }

    const lowerEmail = email.toLowerCase().trim();
    let existingUser = await User.findOne({ email: lowerEmail });

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const customAdminId = adminId || `ADM-${targetInst.shortName || 'INST'}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    if (existingUser) {
      existingUser.role = 'institution_admin';
      existingUser.roles = Array.from(new Set([...(existingUser.roles || []), 'institution_admin', 'user']));
      existingUser.institutionId = targetInst._id;
      existingUser.tenantId = targetInst.tenantId;
      existingUser.adminId = customAdminId;
      existingUser.adminLoginId = customAdminId;
      existingUser.verificationToken = inviteToken;
      await existingUser.save();
    } else {
      existingUser = await User.create({
        name: name.trim(),
        email: lowerEmail,
        password: crypto.randomBytes(16).toString('hex'),
        role: 'institution_admin',
        roles: ['institution_admin', 'user'],
        institutionId: targetInst._id,
        tenantId: targetInst.tenantId,
        adminId: customAdminId,
        adminLoginId: customAdminId,
        mustChangePassword: true,
        verificationToken: inviteToken,
      });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const invitationLink = `${clientUrl}/admin/accept-invite?token=${inviteToken}`;

    await ActivityLog.create({
      userId: req.user._id,
      action: 'INVITE_ADMIN',
      details: `Invited Institution Admin ${existingUser.email} for ${targetInst.name} (${targetInst.tenantId})`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: 'Institution Admin invited successfully.',
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
 * @desc    Toggle Admin Account Status (Activate/Suspend)
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
    await adminUser.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: 'TOGGLE_ADMIN_STATUS',
      details: `Updated Admin ${adminUser.email} status to ${adminUser.status}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

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
};
