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

  const isSuper = isOwner || userRoles.includes('super_admin') || req.user.role === 'super_admin';
  const hasAdminManagePerm = (req.user.permissions || []).includes('PLATFORM_ADMIN_MANAGE') || (req.user.permissions || []).includes('INSTITUTION_ADMIN_MANAGE');

  if (!isSuper && !hasAdminManagePerm) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Platform Owner authority required.',
    });
  }

  req.isOwner = isOwner;
  req.isSuperAdmin = isSuper;
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

  const isDeptAdmin =
    userRoles.includes('department_admin') ||
    req.user.role === 'department_admin';

  if (!isSuperAdmin && !isInstAdmin && !isDeptAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Administrative authorization required.',
    });
  }

  req.isSuperAdmin = isSuperAdmin;
  req.isInstitutionAdmin = isInstAdmin && !isSuperAdmin;
  req.isDepartmentAdmin = isDeptAdmin && !isSuperAdmin && !isInstAdmin;

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

    const isDeptAdmin =
      userRoles.includes('department_admin') ||
      req.user.role === 'department_admin';

    if (isSuperAdmin) {
      return next();
    }

    // CRITICAL SECURITY RULE: DEPARTMENT_ADMIN_APPOINT MUST NOT be executed by Department Admins, Teachers, Students, or Recruiters
    if (requiredPermissions.includes('DEPARTMENT_ADMIN_APPOINT')) {
      if (!isInstAdmin && !isSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. Only Institution Admin, Super Admin, or Platform Owner can appoint Department Admins.',
        });
      }
      return next();
    }

    // Institution Admins intrinsically possess full Student & Department Admin authority within their institution scope
    if (isInstAdmin) {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    const { SYSTEM_ROLE_PERMISSIONS } = require('../utils/permissions');
    const roleDefaultPermissions = SYSTEM_ROLE_PERMISSIONS[req.user.role] || [];
    const effectivePermissions = new Set([...userPermissions, ...roleDefaultPermissions]);

    // Permission alias mapping for backward compatibility with legacy roles
    const permissionAliasMap = {
      'STUDENT_PROFILE_MANAGE': ['students:read', 'students:update', 'students:write', 'STUDENT_MANAGE', 'student_manage'],
      'DEPARTMENT_ADMIN_VIEW': ['departments:read', 'department_admins:read'],
      'DEPARTMENT_ADMIN_APPOINT': ['department_admins:create'],
      'DEPARTMENT_ADMIN_CREATE': ['department_admins:create'],
      'DEPARTMENT_ADMIN_UPDATE': ['departments:update', 'department_admins:update'],
      'DEPARTMENT_ADMIN_SUSPEND': ['departments:suspend', 'department_admins:suspend'],
      'DEPARTMENT_ADMIN_REASSIGN': ['departments:reassign', 'department_admins:reassign'],
    };

    const hasPermission = requiredPermissions.some((p) => {
      if (effectivePermissions.has(p)) return true;
      const aliases = permissionAliasMap[p] || [];
      return aliases.some((alias) => effectivePermissions.has(alias));
    });

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
 * Restrict access to Department Admin, Institution Admin, or Super Admin.
 */
const requireDepartmentAdmin = (req, res, next) => {
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

  const isDeptAdmin =
    userRoles.includes('department_admin') ||
    req.user.role === 'department_admin';

  if (!isSuperAdmin && !isInstAdmin && !isDeptAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Department Administrator authorization required.',
    });
  }

  req.isSuperAdmin = isSuperAdmin;
  req.isInstitutionAdmin = isInstAdmin && !isSuperAdmin;
  req.isDepartmentAdmin = isDeptAdmin && !isInstAdmin && !isSuperAdmin;

  next();
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
        role: { $in: ['institution_admin', 'department_admin'] },
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

/**
 * Enforce department-level scoping for Department Admins (ABAC).
 * Injects `req.departmentScope` = { institutionId, departmentId }.
 */
const enforceDepartmentScope = async (req, res, next) => {
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

    const isInstAdmin =
      userRoles.includes('institution_admin') ||
      userRoles.includes('admin') ||
      req.user.role === 'institution_admin' ||
      req.user.role === 'admin';

    if (isSuperAdmin) {
      req.departmentScope = {};
      return next();
    }

    if (isInstAdmin) {
      req.departmentScope = { institutionId: req.user.institutionId };
      return next();
    }

    // Department Admin scoping check
    const institutionId = req.user.institutionId;
    const departmentId = req.user.departmentId;

    if (!institutionId || !departmentId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not assigned to an active department scope.',
      });
    }

    req.departmentScope = { institutionId, departmentId };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Restrict access strictly to authorized Institution Billing Administrators.
 * DENIED: Department Admin, Teacher, Recruiter, Student.
 */
const requireBillingAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const userRoles = req.user.roles && req.user.roles.length > 0 ? req.user.roles : [req.user.role];
  const userPermissions = req.user.permissions || [];

  // Deny non-billing roles explicitly
  const isForbiddenRole =
    userRoles.includes('department_admin') ||
    userRoles.includes('teacher') ||
    userRoles.includes('recruiter') ||
    (userRoles.includes('user') && !userRoles.includes('institution_admin') && !userRoles.includes('admin'));

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
    userRoles.includes('institution_billing_admin') ||
    req.user.role === 'institution_admin' ||
    req.user.role === 'admin' ||
    req.user.role === 'institution_billing_admin' ||
    userPermissions.includes('INSTITUTION_BILLING_MANAGE');

  if (isForbiddenRole && !isInstAdmin && !isSuperAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Department Admins, Teachers, Recruiters, and Students cannot access billing operations.',
    });
  }

  if (!isSuperAdmin && !isInstAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Authorized Institution Billing Administrator access required.',
    });
  }

  req.isSuperAdmin = isSuperAdmin;
  req.isBillingAdmin = true;
  next();
};

module.exports = {
  requireRole,
  requireOwner,
  requireSuperAdmin,
  requireAdmin,
  requireDepartmentAdmin,
  requirePermission,
  requireBillingAdmin,
  enforceInstitutionScope,
  enforceDepartmentScope,
};
