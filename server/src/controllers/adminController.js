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

/**
 * @desc    Get pending PRN / Institutional identity verifications
 * @route   GET /api/admin/prn-verifications
 * @access  Private (admin)
 */
const getPrnVerifications = async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;
    const query = { prnVerificationStatus: status };

    if (req.institutionScope?.institutionId) {
      query.institutionId = req.institutionScope.institutionId;
    }

    const verifications = await User.find(query)
      .select('name email maviId prn facultyId role requestedRole prnVerificationStatus prnRejectionReason createdAt institutionId university degree')
      .populate('institutionId', 'name code domain')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: verifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve PRN / Institutional identity for a user
 * @route   POST /api/admin/prn-verifications/:id/approve
 * @access  Private (admin)
 */
const approvePrnVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.institutionScope?.institutionId && user.institutionId?.toString() !== req.institutionScope.institutionId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. User belongs to another institution.' });
    }

    user.prnVerificationStatus = 'approved';
    user.prnVerifiedBy = req.user._id;
    user.prnVerifiedAt = new Date();

    // If there is also a pending requested role, approve it as well
    if (user.requestedRole && user.requestedRole !== 'none') {
      user.role = user.requestedRole;
      if (!user.roles.includes(user.requestedRole)) {
        user.roles.push(user.requestedRole);
      }
      user.roleStatus = 'approved';
    }

    await user.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: 'ADMIN_APPROVED_PRN',
      details: `Approved institutional PRN identity verification for ${user.email} (PRN: ${user.prn || user.facultyId || 'N/A'}, MAVI ID: ${user.maviId})`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    try {
      await RecruitmentNotification.create({
        recipientId: user._id,
        senderId: req.user._id,
        type: 'general',
        title: 'Institutional PRN Verified! 🎉',
        message: `Your institutional identity (PRN/Faculty ID: ${user.prn || user.facultyId || 'Verified'}) has been approved by your institution administrator. You can now log in using your PRN, MAVI ID, or Email!`,
      });
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: `Successfully approved PRN verification for ${user.email}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject PRN / Institutional identity for a user
 * @route   POST /api/admin/prn-verifications/:id/reject
 * @access  Private (admin)
 */
const rejectPrnVerification = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.institutionScope?.institutionId && user.institutionId?.toString() !== req.institutionScope.institutionId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. User belongs to another institution.' });
    }

    user.prnVerificationStatus = 'rejected';
    user.prnRejectionReason = reason || 'PRN / Institutional ID verification failed.';
    user.prnVerifiedBy = req.user._id;
    user.prnVerifiedAt = new Date();

    await user.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: 'ADMIN_REJECTED_PRN',
      details: `Rejected PRN identity for ${user.email} (Reason: ${reason || 'None provided'})`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    try {
      await RecruitmentNotification.create({
        recipientId: user._id,
        senderId: req.user._id,
        type: 'general',
        title: 'PRN Verification Update',
        message: `Your institutional identity verification was rejected. Reason: ${reason || 'PRN verification requirements not met.'}`,
      });
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: `PRN verification rejected for ${user.email}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get departments and student/teacher distribution for current institution
 * @route   GET /api/admin/departments
 * @access  Private (admin)
 */
const getDepartments = async (req, res, next) => {
  try {
    const scopeQuery = req.institutionScope?.institutionId
      ? { institutionId: req.institutionScope.institutionId }
      : {};

    const users = await User.find(scopeQuery).select('department role university');

    const deptMap = {};

    users.forEach((u) => {
      const deptName = u.department || u.university?.department || 'General / Unassigned';
      if (!deptMap[deptName]) {
        deptMap[deptName] = { name: deptName, students: 0, teachers: 0, total: 0 };
      }
      if (u.role === 'user') deptMap[deptName].students += 1;
      if (u.role === 'teacher') deptMap[deptName].teachers += 1;
      deptMap[deptName].total += 1;
    });

    const departments = Object.values(deptMap).sort((a, b) => b.total - a.total);

    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current institution settings for Institution Admin
 * @route   PUT /api/admin/my-institution
 * @access  Private (admin)
 */
const updateMyInstitutionSettings = async (req, res, next) => {
  try {
    let instId = req.institutionScope?.institutionId || req.user.institutionId;

    if (!instId && !req.isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'No institution assigned to your admin account.' });
    }

    if (req.isSuperAdmin && req.body.institutionId) {
      instId = req.body.institutionId;
    }

    const { name, code, domain, city, state, country, primaryContact } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (code) updateFields.code = code.toUpperCase();
    if (domain !== undefined) updateFields.domain = domain.toLowerCase().trim();
    if (city !== undefined) updateFields.city = city;
    if (state !== undefined) updateFields.state = state;
    if (country !== undefined) updateFields.country = country;
    if (primaryContact) updateFields.primaryContact = primaryContact;

    const institution = await Institution.findByIdAndUpdate(
      instId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution record not found.' });
    }

    await ActivityLog.create({
      userId: req.user._id,
      action: 'ADMIN_UPDATED_MY_INSTITUTION',
      details: `Admin ${req.user.email} updated settings for institution ${institution.name}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: 'Institution settings updated successfully',
      data: institution,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Dedicated Administrative Endpoint to Change User Institution Assignment
 * @route   PATCH /api/admin/users/:userId/institution
 * @route   PUT /api/admin/users/:userId/institution
 * @access  Private (Institution Admin, Super Admin, Platform Owner)
 */
const updateUserInstitution = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.params.id;
    const { institutionId: targetInstitutionId } = req.body;

    if (!targetInstitutionId) {
      return res.status(400).json({
        success: false,
        message: 'Target institutionId is required in request body.',
      });
    }

    // 1. Verify administrator authorization from authenticated req.user (Never trust req.body.adminId/role)
    const actorRole = req.user.role;
    const actorRoles = req.user.roles || [actorRole];
    const isOwner = actorRoles.includes('platform_owner') || actorRoles.includes('owner') || req.user.email === 'mayur1718khandare@gmail.com' || req.user.adminId === 'MAVI-OWNER-001';
    const isSuperAdmin = isOwner || actorRoles.includes('super_admin') || req.user.email === 'mayur2006khandare@gmail.com' || req.user.adminId === 'MAVI-SA-001';
    const isInstAdmin = isSuperAdmin || actorRoles.includes('institution_admin') || actorRoles.includes('admin');

    if (!isInstAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Only authorized administrators can modify a user\'s institution assignment.',
      });
    }

    // 2. Fetch target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }

    // 3. Fetch target institution
    const newInstitution = await Institution.findById(targetInstitutionId);
    if (!newInstitution) {
      return res.status(404).json({ success: false, message: 'Target institution record not found.' });
    }

    // 4. Verify Institution Admin scope (if not Super Admin/Owner)
    if (!isSuperAdmin) {
      const adminInstId = req.user.institutionId ? req.user.institutionId.toString() : '';
      const currentInstId = targetUser.institutionId ? targetUser.institutionId.toString() : '';
      const targetInstIdStr = newInstitution._id.toString();

      // Institution Admin can only manage users within their assigned institution scope
      if (adminInstId !== currentInstId && adminInstId !== targetInstIdStr) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. Institution administrators can only manage membership within their assigned institution scope.',
        });
      }
    }

    // 5. Store old metadata for audit log
    const oldInstitutionId = targetUser.institutionId ? targetUser.institutionId.toString() : 'None';
    const oldTenantId = targetUser.tenantId || 'None';

    // 6. Update user institution membership & tenant association
    targetUser.institutionId = newInstitution._id;
    targetUser.tenantId = newInstitution.tenantId;
    targetUser.collegeName = newInstitution.name;

    // 7. Handle PRN Verification State (If institution changes, reset verification state)
    if (oldInstitutionId !== newInstitution._id.toString()) {
      targetUser.prnVerificationStatus = 'pending';
      targetUser.isVerifiedStudent = false;
    }

    // 8. Save updated user while preserving MAVI ID, User ID, Profile details & role
    await targetUser.save();

    // 9. Create Immutable Audit Log Event
    await ActivityLog.create({
      userId: req.user._id,
      action: 'INSTITUTION_MEMBERSHIP_UPDATED',
      details: `Admin ${req.user.email} updated user ${targetUser.email} (${targetUser.maviId || targetUser._id}) institution assignment from ${oldTenantId} to ${newInstitution.name} (${newInstitution.tenantId}). PRN status set to pending verification.`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: `User institution assignment updated successfully to ${newInstitution.name}.`,
      data: {
        user: targetUser,
        institution: {
          _id: newInstitution._id,
          name: newInstitution.name,
          tenantId: newInstitution.tenantId,
          officialDomain: newInstitution.officialDomain,
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
};

