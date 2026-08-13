const User = require('../models/User');
const Job = require('../models/Job');
const Company = require('../models/Company');
const PlacementDrive = require('../models/PlacementDrive');
const ActivityLog = require('../models/ActivityLog');

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
    const { role, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query).select('-password').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
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

/**
 * @desc    Get pending role verification requests
 * @route   GET /api/admin/role-requests
 * @access  Private (admin)
 */
const getRoleRequests = async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;
    const query = { roleStatus: status };

    const requests = await User.find(query)
      .select('name email role requestedRole roleStatus roleVerification createdAt')
      .sort({ 'roleVerification.submittedAt': -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve role request for a user
 * @route   POST /api/admin/role-requests/:id/approve
 * @access  Private (admin)
 */
const approveRoleRequest = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.requestedRole || user.requestedRole === 'none') {
      return res.status(400).json({ success: false, message: 'User has no pending role request.' });
    }

    const previousRole = user.role;
    const targetRole = user.requestedRole;

    user.role = targetRole;
    user.roleStatus = 'approved';
    user.roleVerification.reviewedAt = new Date();
    user.roleVerification.reviewedBy = req.user.id;

    await user.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'Admin Approve Role',
      details: `Approved role upgrade for ${user.email} from ${previousRole} to ${targetRole}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: `Successfully approved ${targetRole} role for ${user.email}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject role request for a user
 * @route   POST /api/admin/role-requests/:id/reject
 * @access  Private (admin)
 */
const rejectRoleRequest = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.roleStatus = 'rejected';
    user.roleVerification.reviewedAt = new Date();
    user.roleVerification.reviewedBy = req.user.id;
    user.roleVerification.rejectionReason = reason || 'Verification requirements not met.';

    await user.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'Admin Reject Role',
      details: `Rejected role upgrade for ${user.email} (requested: ${user.requestedRole}, reason: ${reason || 'None provided'})`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: `Role request rejected for ${user.email}`,
      data: user,
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
  getRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
};
