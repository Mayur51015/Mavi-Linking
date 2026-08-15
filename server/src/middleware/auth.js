const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Auth Middleware — protects routes by verifying JWT from the
 * Authorization header (Bearer <token>). Attaches the full
 * user document (minus password) to req.user.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from "Bearer <token>" header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (exclude password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user no longer exists.',
      });
    }

    // ─── Account Suspension Check ────────────────────────────────────
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by an administrator. Please contact support.',
      });
    }

    // ─── Backward Compatibility: migrate old role names & sync roles array ─────
    const roleMigration = { developer: 'user', professor: 'teacher' };
    if (roleMigration[user.role]) {
      user.role = roleMigration[user.role];
      await User.updateOne({ _id: user._id }, { $set: { role: user.role } });
    }

    if (!user.roles || user.roles.length === 0) {
      user.roles = [user.role || 'user'];
      await User.updateOne({ _id: user._id }, { $set: { roles: user.roles } });
    }

    req.user = user;

    // ─── Mandatory Password Change Lock Check ──────────────────────────────
    if (user.mustChangePassword) {
      const currentUrl = req.originalUrl || req.url || '';
      const isAllowedEndpoint =
        currentUrl.includes('/api/auth/change-password') ||
        currentUrl.includes('/api/auth/logout') ||
        currentUrl.includes('/api/auth/me');

      if (!isAllowedEndpoint) {
        return res.status(403).json({
          success: false,
          code: 'PASSWORD_CHANGE_REQUIRED',
          message: 'You must change your temporary password before accessing application features.',
        });
      }
    }

    // ─── Mandatory Student Email Verification Lock Check ──────────────────────
    const isStudent = user.role === 'user' || (Array.isArray(user.roles) && user.roles.includes('user') && !user.roles.includes('admin') && !user.roles.includes('super_admin') && !user.roles.includes('institution_admin'));
    if (isStudent && (!user.emailVerified || user.accountStatus !== 'ACTIVE')) {
      const currentUrl = req.originalUrl || req.url || '';
      const isAllowedVerificationEndpoint =
        currentUrl.includes('/api/auth/me') ||
        currentUrl.includes('/api/auth/verify-email') ||
        currentUrl.includes('/api/auth/resend-verification') ||
        currentUrl.includes('/api/auth/change-email-pending') ||
        currentUrl.includes('/api/auth/logout');

      if (!isAllowedVerificationEndpoint) {
        return res.status(403).json({
          success: false,
          code: 'EMAIL_VERIFICATION_REQUIRED',
          message: 'Please verify your email address before accessing your account.',
          data: {
            email: user.email,
            maviId: user.maviId,
            accountStatus: user.accountStatus,
            emailVerified: user.emailVerified,
          },
        });
      }
    }

    next();
  } catch (error) {
    // Differentiate between expired and malformed tokens
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};

module.exports = { protect };
