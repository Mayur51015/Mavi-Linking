const Institution = require('../models/Institution');
const InstitutionMembership = require('../models/InstitutionMembership');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

/**
 * @desc    Create a new Institution (College / University)
 * @route   POST /api/admin/institutions
 * @access  Private (Super Admin)
 */
const createInstitution = async (req, res, next) => {
  try {
    const { name, shortName, code, officialDomain, domain, type, address, city, state, country, plan, primaryContact, features } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Institution name is required' });
    }

    const crypto = require('crypto');
    const codePrefix = (code || shortName || name.substring(0, 4)).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const generatedTenantId = `INST-${codePrefix.substring(0, 6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    if (code) {
      const existingCode = await Institution.findOne({ code: code.toUpperCase() });
      if (existingCode) {
        return res.status(409).json({ success: false, message: 'Institution code already exists' });
      }
    }

    const institution = await Institution.create({
      name,
      shortName: shortName || '',
      code: code ? code.toUpperCase() : undefined,
      tenantId: generatedTenantId,
      officialDomain: officialDomain ? officialDomain.toLowerCase().trim() : '',
      domain: domain ? domain.toLowerCase().trim() : '',
      type: type || 'College',
      address: address || '',
      city: city || '',
      state: state || '',
      country: country || 'India',
      plan: plan || 'ENTERPRISE',
      primaryContact: primaryContact || {},
      features: features || { developerDNA: true, recruiterAIReport: true, advancedAnalytics: true, aiCareerGuidance: true },
      createdBy: req.user._id,
    });

    await ActivityLog.create({
      userId: req.user._id,
      action: 'ADMIN_CREATED_INSTITUTION',
      details: `Created institution: ${institution.name} (Tenant ID: ${institution.tenantId})`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(201).json({
      success: true,
      message: 'Institution created successfully',
      data: institution,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of institutions (with search & pagination)
 * @route   GET /api/admin/institutions
 * @access  Private (Admin)
 */
const getInstitutions = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const query = {};

    // Scoping check for Institution Admins
    if (req.isInstitutionAdmin && !req.isSuperAdmin) {
      if (req.user.institutionId) {
        query._id = req.user.institutionId;
      } else {
        const membership = await InstitutionMembership.findOne({
          userId: req.user._id,
          role: 'institution_admin',
        });
        if (membership) {
          query._id = membership.institutionId;
        } else {
          return res.status(200).json({
            success: true,
            data: { institutions: [], pagination: { total: 0, page: 1, pages: 0 } },
          });
        }
      }
    }

    if (status) query.status = new RegExp(`^${status}$`, 'i');
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [institutions, total] = await Promise.all([
      Institution.find(query).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      Institution.countDocuments(query),
    ]);

    // Attach admin counts to each institution
    const institutionIds = institutions.map((inst) => inst._id);
    const adminMemberships = await InstitutionMembership.find({
      institutionId: { $in: institutionIds },
      role: 'institution_admin',
      status: 'active',
    }).populate('userId', 'name email avatar status');

    const institutionsWithAdmins = institutions.map((inst) => {
      const instObj = inst.toObject();
      instObj.admins = adminMemberships
        .filter((m) => m.institutionId.toString() === inst._id.toString())
        .map((m) => m.userId);
      return instObj;
    });

    res.status(200).json({
      success: true,
      data: {
        institutions: institutionsWithAdmins,
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
 * @desc    Get single institution details
 * @route   GET /api/admin/institutions/:id
 * @access  Private (Admin)
 */
const getInstitutionById = async (req, res, next) => {
  try {
    const institution = await Institution.findById(req.params.id);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    if (!institution.institutionCode || !institution.code) {
      const activeCode = institution.institutionCode || institution.code || institution.tenantId;
      if (activeCode) {
        institution.institutionCode = activeCode;
        institution.code = activeCode;
        await institution.save();
      }
    }

    // Security check: Institution Admin can only view their assigned institution
    if (req.isInstitutionAdmin && !req.isSuperAdmin) {
      if (req.user.institutionId?.toString() !== institution._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied to this institution' });
      }
    }

    const admins = await InstitutionMembership.find({
      institutionId: institution._id,
      role: 'institution_admin',
      status: 'active',
    }).populate('userId', 'name email avatar status createdAt');

    const [studentCount, teacherCount] = await Promise.all([
      User.countDocuments({ institutionId: institution._id, role: 'user' }),
      User.countDocuments({ institutionId: institution._id, role: 'teacher' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        institution,
        admins: admins.map((m) => m.userId),
        stats: {
          students: studentCount,
          teachers: teacherCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Institution details
 * @route   PUT /api/admin/institutions/:id
 * @access  Private (Super Admin)
 */
const updateInstitution = async (req, res, next) => {
  try {
    const { name, code, domain, type, address, city, state, country, status } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (code) updateFields.code = code.toUpperCase();
    if (domain !== undefined) updateFields.domain = domain.toLowerCase().trim();
    if (type) updateFields.type = type;
    if (address !== undefined) updateFields.address = address;
    if (city !== undefined) updateFields.city = city;
    if (state !== undefined) updateFields.state = state;
    if (country !== undefined) updateFields.country = country;
    if (status) updateFields.status = status;

    const institution = await Institution.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    await ActivityLog.create({
      userId: req.user._id,
      action: 'ADMIN_UPDATED_INSTITUTION',
      details: `Updated institution details for ${institution.name}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: 'Institution updated successfully',
      data: institution,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign a User as Institution Admin
 * @route   POST /api/admin/institutions/:id/assign-admin
 * @access  Private (Super Admin)
 */
const assignInstitutionAdmin = async (req, res, next) => {
  try {
    const { email, userId } = req.body;
    const institutionId = req.params.id;

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    let targetUser = null;
    if (userId) {
      targetUser = await User.findById(userId);
    } else if (email) {
      targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User account not found with the provided email or ID.',
      });
    }

    // Prevent making a Super Admin an institution admin
    if (targetUser.role === 'super_admin' || targetUser.roles.includes('super_admin')) {
      return res.status(400).json({
        success: false,
        message: 'User is already a Super Admin and cannot be assigned as a scoped Institution Admin.',
      });
    }

    // Update user role, roles array, and institutionId
    targetUser.role = 'institution_admin';
    if (!targetUser.roles.includes('institution_admin')) {
      targetUser.roles.push('institution_admin');
    }
    targetUser.institutionId = institution._id;
    await targetUser.save();

    // Create or update InstitutionMembership
    await InstitutionMembership.findOneAndUpdate(
      { userId: targetUser._id, institutionId: institution._id },
      {
        userId: targetUser._id,
        institutionId: institution._id,
        role: 'institution_admin',
        status: 'active',
        assignedBy: req.user._id,
      },
      { upsert: true, new: true }
    );

    await ActivityLog.create({
      userId: req.user._id,
      action: 'ADMIN_ASSIGNED_INSTITUTION_ADMIN',
      details: `Assigned ${targetUser.email} as Institution Admin for ${institution.name}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: `Successfully assigned ${targetUser.name} as Institution Admin for ${institution.name}`,
      data: {
        user: targetUser,
        institution,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove an Institution Admin
 * @route   POST /api/admin/institutions/:id/remove-admin
 * @access  Private (Super Admin)
 */
const removeInstitutionAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const institutionId = req.params.id;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Demote role back to 'user'
    targetUser.role = 'user';
    targetUser.roles = targetUser.roles.filter((r) => r !== 'institution_admin');
    if (targetUser.roles.length === 0) targetUser.roles = ['user'];
    targetUser.institutionId = null;
    await targetUser.save();

    await InstitutionMembership.deleteOne({
      userId: targetUser._id,
      institutionId,
      role: 'institution_admin',
    });

    await ActivityLog.create({
      userId: req.user._id,
      action: 'ADMIN_REMOVED_INSTITUTION_ADMIN',
      details: `Removed Institution Admin privileges from ${targetUser.email}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: `Institution Admin privileges removed for ${targetUser.name}`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInstitution,
  getInstitutions,
  getInstitutionById,
  updateInstitution,
  assignInstitutionAdmin,
  removeInstitutionAdmin,
};
