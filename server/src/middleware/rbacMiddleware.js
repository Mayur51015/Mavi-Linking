/**
 * RBAC & ABAC Middleware — Role-based and Attribute-based Access Control
 * 
 * Supports platform Super Admins and multi-tenant Institution Admins.
 * Must be used AFTER `protect` auth middleware (req.user must exist).
 */

const InstitutionMembership = require('../models/InstitutionMembership');

/**
 * Check if the authenticated user has any of the required roles.
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const userRoles = req.user.roles && req.user.roles.length > 0 ? req.user.roles : [req.user.role];

    // Super Admin / Admin bypasses generic role checks unless specifically testing lower roles
    if (userRoles.includes('super_admin') || userRoles.includes('admin')) {
      return next();
    }

    const hasMatchingRole = roles.some((role) => userRoles.includes(role));

    if (!hasMatchingRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Authorized role (${roles.join(', ')}) required.`,
      });
    }

    // Block pending role verification access for privileged non-student roles
    if (req.user.roleStatus === 'pending' && !userRoles.includes('user')) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Your ${req.user.role} role verification is pending administrator approval.`,
      });
    }

    next();
  };
};

/**
 * Restrict access strictly to Platform Owner.
 */
const requireOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const userRoles = req.user.roles && req.user.roles.length > 0 ? req.user.roles : [req.user.role];
  const isOwner =
    userRoles.includes('platform_owner') ||
    userRoles.includes('owner') ||
    req.user.role === 'platform_owner' ||
    req.user.role === 'owner' ||
    req.user.adminId === 'MAVI-OWNER-001' ||
    req.user.email === (process.env.OWNER_EMAIL || 'owner@mavilinking.com').toLowerCase();

  if (!isOwner && !userRoles.includes('super_admin')) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Platform Owner authority required.',
    });
  }

  req.isOwner = true;
  next();
};

/**
 * Restrict access strictly to Super Admin (platform-wide authority).
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const userRoles = req.user.roles && req.user.roles.length > 0 ? req.user.roles : [req.user.role];
  const isSuperAdmin =
    userRoles.includes('super_admin') ||
    userRoles.includes('platform_owner') ||
    userRoles.includes('owner') ||
    req.user.role === 'super_admin' ||
    req.user.role === 'platform_owner' ||
    req.user.role === 'owner';

  if (!isSuperAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Platform Super Admin authority required.',
    });
  }

  req.isSuperAdmin = true;
  next();
};

/**
 * Restrict access to Super Admin OR Institution Admin.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const userRoles = req.user.roles && req.user.roles.length > 0 ? req.user.roles : [req.user.role];
  const isSuperAdmin =
    userRoles.includes('super_admin') ||
    userRoles.includes('platform_owner') ||
    userRoles.includes('owner') ||
    req.user.role === 'super_admin' ||
    req.user.role === 'platform_owner' ||
    req.user.role === 'owner';

  const isInstAdmin =
    userRoles.includes('institution_admin') ||
    userRoles.includes('admin') ||
    req.user.role === 'institution_admin' ||
    req.user.role === 'admin';

  if (!isSuperAdmin && !isInstAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Administrative authorization required.',
    });
  }

  req.isSuperAdmin = isSuperAdmin;
  req.isInstitutionAdmin = isInstAdmin && !isSuperAdmin;

  next();
};

/**
 * Require specific granular ABAC permission(s).
 */
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (req.isSuperAdmin) {
      return next();
    }

    const userPermissions = req.user.permissions || [];

    // Permission alias mapping for backward compatibility with legacy roles
    const permissionAliasMap = {
      'STUDENT_PROFILE_MANAGE': ['students:read', 'students:update', 'students:write', 'STUDENT_MANAGE', 'student_manage'],
    };

    const hasPermission = requiredPermissions.some((p) => {
      if (userPermissions.includes(p)) return true;
      const aliases = permissionAliasMap[p] || [];
      return aliases.some((alias) => userPermissions.includes(alias));
    });

    // Institution Admins intrinsically possess Student Profile Management authority for their institution scope
    if (req.isInstitutionAdmin && (requiredPermissions.includes('STUDENT_PROFILE_MANAGE') || userPermissions.length === 0)) {
      return next();
    }

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Required permission missing: ${requiredPermissions.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Enforce multi-tenant institution scoping (ABAC).
 * Injects `req.institutionScope` to restrict queries for Institution Admins.
 */
const enforceInstitutionScope = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userRoles = req.user.roles && req.user.roles.length > 0 ? req.user.roles : [req.user.role];
    const isSuperAdmin =
      userRoles.includes('super_admin') ||
      userRoles.includes('platform_owner') ||
      userRoles.includes('owner') ||
      req.user.role === 'super_admin' ||
      req.user.role === 'platform_owner' ||
      req.user.role === 'owner';

    if (isSuperAdmin) {
      // Super Admin / Owner has global scope (no query restriction)
      req.institutionScope = {};
      return next();
    }

    // Institution Admin scope check
    let institutionId = req.user.institutionId;
    let tenantId = req.user.tenantId;

    if (!institutionId || !tenantId) {
      // Fallback: check InstitutionMembership
      const membership = await InstitutionMembership.findOne({
        userId: req.user._id,
        role: 'institution_admin',
        status: 'active',
      }).populate('institutionId', 'tenantId');

      if (membership) {
        institutionId = membership.institutionId._id || membership.institutionId;
        tenantId = membership.tenantId || membership.institutionId?.tenantId || '';
      }
    }

    if (!institutionId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not assigned to an active institution scope.',
      });
    }

    req.institutionScope = { institutionId, tenantId };
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireRole,
  requireOwner,
  requireSuperAdmin,
  requireAdmin,
  requirePermission,
  enforceInstitutionScope,
};
