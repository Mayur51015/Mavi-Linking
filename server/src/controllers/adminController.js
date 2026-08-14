const User = require('../models/User');
const Job = require('../models/Job');
const Company = require('../models/Company');
const PlacementDrive = require('../models/PlacementDrive');
const ActivityLog = require('../models/ActivityLog');
const RecruitmentNotification = require('../models/RecruitmentNotification');
const Institution = require('../models/Institution');

/**
 * @desc    Get Admin Dashboard metrics (Platform-wide or Institution-scoped)
 * @route   GET /api/admin/stats
 * @access  Private (admin)
 */
const getAdminStats = async (req, res, next) => {
  try {
    const scopeQuery = req.institutionScope?.institutionId
      ? { institutionId: req.institutionScope.institutionId }
      : {};

    const [studentCount, recruiterCount, teacherCount, jobCount, driveCount, institutionCount, suspendedCount] = await Promise.all([
      User.countDocuments({ ...scopeQuery, role: 'user' }),
      User.countDocuments({ ...scopeQuery, role: 'recruiter' }),
      User.countDocuments({ ...scopeQuery, role: 'teacher' }),
      Job.countDocuments(),
      PlacementDrive.countDocuments(),
      Institution.countDocuments(req.institutionScope?.institutionId ? { _id: req.institutionScope.institutionId } : {}),
      User.countDocuments({ ...scopeQuery, status: 'suspended' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        students: studentCount,
        recruiters: recruiterCount,
        teachers: teacherCount,
        jobs: jobCount,
        drives: driveCount,
        institutions: institutionCount,
        suspended: suspendedCount,
        isScoped: !!req.institutionScope?.institutionId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users with optional role filtering and institution scope
 * @route   GET /api/admin/users
 * @access  Private (admin)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, search, status, page = 1, limit = 50 } = req.query;
    const query = {};

    // Apply institution scope if present
    if (req.institutionScope?.institutionId) {
      query.institutionId = req.institutionScope.institutionId;
    }

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { maviId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('institutionId', 'name code')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
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
 * @desc    Update a user profile, verification, or role (with privilege escalation checks)
 * @route   PUT /api/admin/users/:id
 * @access  Private (admin)
 */
const updateUser = async (req, res, next) => {
  try {
    const { role, isVerified, name, email, status } = req.body;
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Security check: Institution Admin cannot modify users outside their institution
    if (req.institutionScope?.institutionId && userToUpdate.institutionId?.toString() !== req.institutionScope.institutionId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only manage users within your assigned institution.' });
    }

    // Security check: Institution Admin cannot assign super_admin or admin roles
    if (role && ['super_admin', 'admin'].includes(role) && !req.isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden. Only Super Admins can grant administrative privileges.' });
    }

    const updateFields = {};
    if (role) {
      updateFields.role = role;
      if (!userToUpdate.roles.includes(role)) {
        updateFields.roles = [...userToUpdate.roles, role];
      }
    }
    if (isVerified !== undefined) updateFields.isVerified = isVerified;
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (status) updateFields.status = status;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    await ActivityLog.create({
      userId: req.user._id,
      action: 'ADMIN_UPDATE_USER',
      details: `Admin ${req.user.email} updated user ${user.email} (Role: ${user.role}, Status: ${user.status})`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Suspend or activate a user account
 * @route   PUT /api/admin/users/:id/status
 * @access  Private (admin)
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be active or suspended.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Security check: Cannot suspend Super Admin unless self/Super Admin
    if (['super_admin', 'admin'].includes(user.role) && !req.isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Cannot modify administrative user accounts.' });
    }

    // Security check: Institution Admin scope
    if (req.institutionScope?.institutionId && user.institutionId?.toString() !== req.institutionScope.institutionId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. User belongs to another institution.' });
    }

    user.status = status;
    await user.save();

    const actionName = status === 'suspended' ? 'ADMIN_SUSPENDED_USER' : 'ADMIN_ACTIVATED_USER';
    await ActivityLog.create({
      userId: req.user._id,
      action: actionName,
      details: `${status === 'suspended' ? 'Suspended' : 'Activated'} user ${user.email}. Reason: ${reason || 'Not specified'}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    try {
      await RecruitmentNotification.create({
        recipientId: user._id,
        senderId: req.user._id,
        type: 'general',
        title: status === 'suspended' ? 'Account Suspended ⚠️' : 'Account Reactivated ✅',
        message: status === 'suspended'
          ? `Your MAVI Linking account has been suspended. Reason: ${reason || 'Policy review'}. Contact support for assistance.`
          : 'Your MAVI Linking account has been reactivated. You may now log in.',
      });
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: `User account ${status === 'suspended' ? 'suspended' : 'activated'} successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a user account
 * @route   DELETE /api/admin/users/:id
 * @access  Private (admin)
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (['super_admin', 'admin'].includes(user.role) && !req.isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Cannot delete administrative user accounts.' });
    }

    if (req.institutionScope?.institutionId && user.institutionId?.toString() !== req.institutionScope.institutionId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. User belongs to another institution.' });
    }

    await user.deleteOne();

    await ActivityLog.create({
      userId: req.user._id,
      action: 'ADMIN_DELETED_USER',
      details: `Admin ${req.user.email} deleted user account: ${user.email}`,
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
 * @desc    Get audit trail logs (Platform or Institution scoped)
 * @route   GET /api/admin/logs
 * @access  Private (admin)
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (req.institutionScope?.institutionId) {
      // Find users belonging to this institution
      const instUserIds = await User.find({ institutionId: req.institutionScope.institutionId }).distinct('_id');
      query.userId = { $in: instUserIds };
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('userId', 'name email role status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ActivityLog.countDocuments(query),
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

    if (req.institutionScope?.institutionId) {
      query.institutionId = req.institutionScope.institutionId;
    }

    const requests = await User.find(query)
      .select('name email role requestedRole roleStatus roleVerification status createdAt institutionId')
      .populate('institutionId', 'name code')
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

    if (req.institutionScope?.institutionId && user.institutionId?.toString() !== req.institutionScope.institutionId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. User belongs to another institution.' });
    }

    if (!user.requestedRole || user.requestedRole === 'none') {
      return res.status(400).json({ success: false, message: 'User has no pending role request.' });
    }

    const previousRole = user.role;
    const targetRole = user.requestedRole;

    user.role = targetRole;
    if (!user.roles.includes(targetRole)) {
      user.roles.push(targetRole);
    }
    user.roleStatus = 'approved';
    user.roleVerification.reviewedAt = new Date();
    user.roleVerification.reviewedBy = req.user._id;

    await user.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: 'ADMIN_APPROVED_ROLE',
      details: `Approved role upgrade for ${user.email} from ${previousRole} to ${targetRole}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    try {
      await RecruitmentNotification.create({
        recipientId: user._id,
        senderId: req.user._id,
        type: 'general',
        title: 'Verification Request Approved! 🎉',
        message: `Your verification request for the ${targetRole.toUpperCase()} role has been approved by an administrator. You now have full access to the ${targetRole} features.`,
      });
    } catch (_) {}

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

    if (req.institutionScope?.institutionId && user.institutionId?.toString() !== req.institutionScope.institutionId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. User belongs to another institution.' });
    }

    user.roleStatus = 'rejected';
    user.roleVerification.reviewedAt = new Date();
    user.roleVerification.reviewedBy = req.user._id;
    user.roleVerification.rejectionReason = reason || 'Verification requirements not met.';

    await user.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: 'ADMIN_REJECTED_ROLE',
      details: `Rejected role upgrade for ${user.email} (requested: ${user.requestedRole}, reason: ${reason || 'None provided'})`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    try {
      await RecruitmentNotification.create({
        recipientId: user._id,
        senderId: req.user._id,
        type: 'general',
        title: 'Verification Request Update',
        message: `Your verification request for the ${user.requestedRole || 'requested'} role was not approved. Reason: ${reason || 'Verification requirements not met.'}`,
      });
    } catch (_) {}

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
  updateUserStatus,
  deleteUser,
  getAuditLogs,
  getRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
};
