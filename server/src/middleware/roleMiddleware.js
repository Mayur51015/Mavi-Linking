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
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // Admins bypass role checks
    if (req.user.role === 'admin') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Authorized role (${roles.join(', ')}) required.`,
      });
    }

    // If role is pending approval, block access to privileged role endpoints
    if (req.user.roleStatus === 'pending' && req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: `Access denied. Your ${req.user.role} role verification is pending administrator approval.`,
      });
    }

    next();
  };
};

module.exports = { requireRole };
