/**
 * Middleware: requirePasswordChangeResolved
 * Enforces server-side password change lock for accounts with mustChangePassword: true.
 * Blocks all API endpoints except password change, logout, and identity inspection.
 */
const requirePasswordChangeResolved = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  if (req.user.mustChangePassword) {
    const allowedPaths = [
      '/api/auth/change-password',
      '/api/auth/logout',
      '/api/auth/me',
    ];

    const currentPath = (req.baseUrl || '') + (req.path || '');

    if (allowedPaths.some((allowed) => currentPath.endsWith(allowed) || currentPath === allowed)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      code: 'PASSWORD_CHANGE_REQUIRED',
      message: 'You must change your password before accessing system resources.',
    });
  }

  next();
};

module.exports = {
  requirePasswordChangeResolved,
};
