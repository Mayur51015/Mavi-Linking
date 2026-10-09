/**
 * Role Middleware — restricts access to specific user roles.
 * Must be used AFTER the `protect` auth middleware (req.user must exist).
 *
 * Usage:
 *   router.use(protect, requireRole('recruiter'));
 *   router.get('/admin-only', protect, requireRole('admin'), handler);
 */

/**
 * Returns middleware that checks if the authenticated user has one of the
 * allowed roles. Supports single role string or array of roles.
 *
 * @param  {...string} roles  Allowed role(s)
 * @returns {Function}        Express middleware
 */
const roleMigration = { student: 'user', developer: 'user', professor: 'teacher' };
const adminRoles = ['admin', 'super_admin', 'institution_admin', 'owner', 'platform_owner'];

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const userRoles = Array.isArray(req.user.roles) && req.user.roles.length > 0
      ? req.user.roles
      : [req.user.role];
    const normalizedUserRoles = userRoles.map((r) => roleMigration[r] || r);
    const normalizedReqRole = roleMigration[req.user.role] || req.user.role;

    // Admins bypass role checks
    const isAdmin =
      adminRoles.includes(req.user.role) ||
      adminRoles.includes(normalizedReqRole) ||
      normalizedUserRoles.some((r) => adminRoles.includes(r));

    if (isAdmin) {
      return next();
    }

    const normalizedAllowedRoles = roles.map((r) => roleMigration[r] || r);
    const hasAllowedRole =
      roles.includes(req.user.role) ||
      normalizedAllowedRoles.includes(normalizedReqRole) ||
      userRoles.some((r) => roles.includes(r)) ||
      normalizedUserRoles.some((r) => normalizedAllowedRoles.includes(r));

    if (!hasAllowedRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Authorized role (${roles.join(', ')}) required.`,
      });
    }

    // If role is pending approval, block access to privileged role endpoints
    if (req.user.roleStatus === 'pending' && !normalizedUserRoles.includes('user')) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Your ${req.user.role} role verification is pending administrator approval.`,
      });
    }

    next();
  };
};

module.exports = { requireRole };
