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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_mavi_secret_key_2026');

    // Attach user to request (exclude password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user no longer exists.',
      });
    }

    // ─── Session / Token Version Invalidation Check ──────────────────
    if (
      decoded.tokenVersion !== undefined &&
      user.tokenVersion !== undefined &&
      decoded.tokenVersion !== user.tokenVersion
    ) {
      return res.status(401).json({
        success: false,
        code: 'SESSION_INVALIDATED',
        message: 'Your session has been invalidated or expired. Please log in again.',
      });
    }

    // ─── Account Deactivation Check (Indefinite Disable) ────────────
    if (user.accountStatus === 'DEACTIVATED' || user.status === 'deactivated') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_DEACTIVATED',
        message: 'Your account has been deactivated. Please contact an authorized administrator to reactivate your account.',
        data: {
          accountStatus: 'DEACTIVATED',
          deactivatedAt: user.deactivatedAt,
          reason: user.deactivationReason || 'Account deactivated',
        },
      });
    }

    // ─── Account Suspension Check with Auto-Expiration Support ───────
    if (user.accountStatus === 'SUSPENDED' || user.status === 'suspended') {
      if (user.suspendedUntil && new Date(user.suspendedUntil).getTime() <= Date.now()) {
        user.accountStatus = 'ACTIVE';
        user.status = 'active';
        user.suspendedAt = null;
        user.suspendedBy = null;
        user.suspendedUntil = null;
        user.suspensionReason = '';
        await user.save();
      } else {
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been temporarily suspended by an administrator.',
          data: {
            accountStatus: 'SUSPENDED',
            suspendedAt: user.suspendedAt,
            suspendedUntil: user.suspendedUntil,
            reason: user.suspensionReason || 'Administrative suspension',
          },
        });
      }
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

    // ─── Mandatory Student 2-Stage Verification & Access Matrix Check ───────────────
    const isStudent = user.role === 'user' || (Array.isArray(user.roles) && user.roles.includes('user') && !user.roles.includes('admin') && !user.roles.includes('super_admin') && !user.roles.includes('institution_admin') && !user.roles.includes('department_admin'));
    if (isStudent) {
      if (!user.emailVerified) {
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
              emailVerified: false,
            },
          });
        }
      }

      if (user.accountStatus === 'REJECTED') {
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_REJECTED',
          message: 'Your account registration was rejected by your institution administrator.',
          data: {
            email: user.email,
            maviId: user.maviId,
            accountStatus: 'REJECTED',
            rejectionReason: user.rejectionReason || 'Registration rejected by administrator.',
          },
        });
      }

      if (user.accountStatus === 'PENDING_ADMIN_APPROVAL' || user.accountStatus === 'PENDING_VERIFICATION') {
        const currentUrl = req.originalUrl || req.url || '';
        const isRestrictedEndpoint =
          currentUrl.includes('/api/analytics') ||
          currentUrl.includes('/api/placement') ||
          currentUrl.includes('/api/jobs') ||
          currentUrl.includes('/api/leaderboard') ||
          currentUrl.includes('/api/recruiters') ||
          currentUrl.includes('/api/ai-insights');

        if (isRestrictedEndpoint) {
          return res.status(403).json({
            success: false,
            code: 'ACCOUNT_PENDING_VERIFICATION',
            message: 'Verification Required. This feature will become available after your account is approved by your institution administrator.',
            data: {
              accountStatus: user.accountStatus,
              maviId: user.maviId,
            },
          });
        }
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
