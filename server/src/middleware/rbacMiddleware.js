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
 * Restrict access strictly to Super Admin (platform-wide authority).
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const userRoles = req.user.roles && req.user.roles.length > 0 ? req.user.roles : [req.user.role];
  const isSuperAdmin = userRoles.includes('super_admin') || req.user.role === 'super_admin' || req.user.role === 'admin';

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
  const isAdminUser =
    userRoles.includes('super_admin') ||
    userRoles.includes('admin') ||
    userRoles.includes('institution_admin') ||
    req.user.role === 'admin' ||
    req.user.role === 'institution_admin';

  if (!isAdminUser) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Administrative authorization required.',
    });
  }

  req.isSuperAdmin = userRoles.includes('super_admin') || req.user.role === 'admin' || req.user.role === 'super_admin';
  req.isInstitutionAdmin = userRoles.includes('institution_admin') || req.user.role === 'institution_admin';

  next();
};

/**
 * Enforce multi-tenant institution scoping (ABAC).
 * Injects `req.institutionQuery` to restrict queries for Institution Admins.
 */
const enforceInstitutionScope = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userRoles = req.user.roles && req.user.roles.length > 0 ? req.user.roles : [req.user.role];
    const isSuperAdmin = userRoles.includes('super_admin') || req.user.role === 'admin' || req.user.role === 'super_admin';

    if (isSuperAdmin) {
      // Super Admin has global scope (no query restriction)
      req.institutionScope = {};
      return next();
    }

    // Institution Admin scope check
    let institutionId = req.user.institutionId;

    if (!institutionId) {
      // Fallback: check InstitutionMembership
      const membership = await InstitutionMembership.findOne({
        userId: req.user._id,
        role: 'institution_admin',
        status: 'active',
      });

      if (membership) {
        institutionId = membership.institutionId;
      }
    }

    if (!institutionId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not assigned to an active institution scope.',
      });
    }

    req.institutionScope = { institutionId };
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  enforceInstitutionScope,
};
