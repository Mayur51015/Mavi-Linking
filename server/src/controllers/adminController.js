const User = require('../models/User');
const Job = require('../models/Job');
const Company = require('../models/Company');
const PlacementDrive = require('../models/PlacementDrive');
const ActivityLog = require('../models/ActivityLog');
const { buildSearchFilter, parsePagination, totalPages } = require('../utils/queryHelpers');

/**
 * @desc    Get Admin Dashboard metrics
 * @route   GET /api/admin/stats
 * @access  Private (admin)
 */
const getAdminStats = async (req, res, next) => {
  try {
    const [studentCount, recruiterCount, teacherCount, jobCount, driveCount] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'recruiter' }),
      User.countDocuments({ role: 'teacher' }),
      Job.countDocuments(),
      PlacementDrive.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        students: studentCount,
        recruiters: recruiterCount,
        teachers: teacherCount,
        jobs: jobCount,
        drives: driveCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users with optional role filtering
 * @route   GET /api/admin/users
 * @access  Private (admin)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50 });
    const query = {};

    if (role) query.role = role;

    const searchFilter = buildSearchFilter(search, ['name', 'email']);
    if (searchFilter) {
      Object.assign(query, searchFilter);
    }

    const [users, total] = await Promise.all([
      User.find(query).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          pages: totalPages(total, limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a user profile status or role
 * @route   PUT /api/admin/users/:id
 * @access  Private (admin)
 */
const updateUser = async (req, res, next) => {
  try {
    const { role, isVerified, name, email } = req.body;
    const updateFields = {};

    if (role) updateFields.role = role;
    if (isVerified !== undefined) updateFields.isVerified = isVerified;
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await ActivityLog.create({
      userId: req.user.id,
      action: 'Admin Update User',
      details: `Admin modified user ${user.email} (verified: ${user.isVerified})`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/ban a user
 * @route   DELETE /api/admin/users/:id
 * @access  Private (admin)
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.deleteOne();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'Admin Delete User',
      details: `Admin deleted user account: ${user.email}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get audit trail logs
 * @route   GET /api/admin/logs
 * @access  Private (admin)
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      ActivityLog.find()
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ActivityLog.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
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
  getAdminStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAuditLogs,
};
