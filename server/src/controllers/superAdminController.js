const User = require('../models/User');
const Institution = require('../models/Institution');
const InstitutionMembership = require('../models/InstitutionMembership');
const ActivityLog = require('../models/ActivityLog');
const RecruitmentNotification = require('../models/RecruitmentNotification');
const crypto = require('crypto');

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
 * @desc    Create/Invite a new Administrator (Super Admin or Institution Admin)
 * @route   POST /api/super-admin/admins
 * @access  Private (Super Admin)
 */
const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role, institutionId } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const targetRole = ['super_admin', 'admin', 'institution_admin'].includes(role) ? role : 'admin';
    const lowerEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: lowerEmail });

    if (user) {
      // Upgrade existing user to admin
      user.role = targetRole;
      if (!user.roles.includes(targetRole)) user.roles.push(targetRole);
      if (!user.roles.includes('admin')) user.roles.push('admin');
      if (institutionId) user.institutionId = institutionId;
      user.status = 'active';
      await user.save();
    } else {
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required to create a new admin account.' });
      }

      user = await User.create({
        name,
        email: lowerEmail,
        password,
        role: targetRole,
        roles: [targetRole, 'admin', 'user'],
        institutionId: institutionId || null,
        status: 'active',
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
          role: targetRole === 'institution_admin' ? 'institution_admin' : 'institution_admin',
          status: 'active',
          assignedBy: req.user._id,
        },
        { upsert: true, new: true }
      );
    }

    await ActivityLog.create({
      userId: req.user._id,
      action: 'SUPER_ADMIN_CREATED_ADMIN',
      details: `Created/Promoted ${user.email} (Role: ${targetRole})`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    try {
      await RecruitmentNotification.create({
        recipientId: user._id,
        senderId: req.user._id,
        type: 'general',
        title: 'Administrative Access Granted 🔑',
        message: `You have been granted ${targetRole.replace('_', ' ').toUpperCase()} access on MAVI Linking.`,
      });
    } catch (_) {}

    res.status(201).json({
      success: true,
      message: `Admin privileges granted to ${user.email}`,
      data: user,
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

module.exports = {
  getSuperAdminStats,
  getAllAdmins,
  createAdmin,
  removeAdmin,
  getSecurityEvents,
};
