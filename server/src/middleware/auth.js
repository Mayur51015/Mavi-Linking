const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const supabaseAuthService = require('../services/supabaseAuthService');

/**
 * Auth Middleware — protects routes by verifying JWT from the
 * Authorization header (Bearer <token>).
 * Supports both verified Supabase access tokens and legacy signed JWTs.
 * Attaches the full user document (minus password) to req.user.
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

    let user;
    let decoded;

    // ─── 1. Supabase Access Token Verification Flow ──────────────────
    if (supabaseAuthService.isSupabaseTokenCandidate(token)) {
      const verification = await supabaseAuthService.verifySupabaseToken(token);
      if (!verification.valid) {
        if (
          verification.error === 'TokenExpiredError' ||
          String(verification.error).toLowerCase().includes('expired')
        ) {
          return res.status(401).json({
            success: false,
            code: 'TOKEN_EXPIRED',
            message: 'Token has expired. Please login again.',
          });
        }
        return res.status(401).json({
          success: false,
          code: 'INVALID_TOKEN',
          message: verification.error || 'Access denied. Invalid Supabase token.',
        });
      }

      const supabaseUser = verification.user;
      req.supabaseUser = supabaseUser;
      req.authProvider = 'supabase';

      const currentUrl = req.originalUrl || req.url || '';

      // Resolve corresponding MongoDB user profile by verified supabaseUid
      user = await User.findOne({ supabaseUid: supabaseUser.id }).select('-password');

      if (!user) {
        // Safe Profile Resolution & Provisioning
        const lowerEmail = (supabaseUser.email || '').toLowerCase().trim();
        const existingEmailUser = await User.findOne({ email: lowerEmail }).select('+password');

        if (existingEmailUser) {
          // If accessing the link-account endpoint, allow request to proceed to controller
          if (currentUrl.includes('/api/auth/supabase/link-account')) {
            req.existingUserToLink = existingEmailUser;
            return next();
          }

          // Zero-Trust Rule: Do NOT automatically grant access to an existing account merely because email matches
          return res.status(403).json({
            success: false,
            code: 'ACCOUNT_LINKING_REQUIRED',
            message: 'An existing EduTalentX account is registered with this email. Please log in with your credentials to link your Supabase account.',
            data: { email: lowerEmail },
          });
        }

        // If accessing sync-profile, allow syncSupabaseProfile controller to provision from body payload
        if (currentUrl.includes('/api/auth/supabase/sync-profile')) {
          return next();
        }

        // Safe profile auto-provisioning for verified brand new student on general endpoints
        const userName =
          supabaseUser.user_metadata?.name ||
          supabaseUser.user_metadata?.full_name ||
          lowerEmail.split('@')[0] ||
          'EduTalentX User';

        user = await User.create({
          name: userName,
          email: lowerEmail,
          supabaseUid: supabaseUser.id,
          authProvider: 'supabase',
          role: 'user', // strictly default to 'user' (student)
          roles: ['user'],
          requestedRole: 'none',
          roleStatus: 'active',
          accountStatus: 'PENDING_VERIFICATION',
          emailVerified: Boolean(supabaseUser.email_confirmed_at),
        });
      }

      // Synchronize confirmed email state from Supabase if verified
      if (supabaseUser.email_confirmed_at && !user.emailVerified) {
        user.emailVerified = true;
        await User.updateOne({ _id: user._id }, { $set: { emailVerified: true } });
      }
    } else {
      // ─── 2. Legacy Signed JWT Verification Flow ────────────────────
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_mavi_secret_key_2026');

      const userId = decoded.id || decoded._id || decoded.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          code: 'INVALID_TOKEN',
          message: 'Access denied. Invalid token payload.',
        });
      }

      // Attach user to request (exclude password) — safe ObjectId and fallback lookup
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId).select('-password');
      } else {
        user = await User.findOne({
          $or: [
            { etxId: String(userId).toUpperCase() },
            { adminId: String(userId).toUpperCase() },
            { adminLoginId: String(userId).toUpperCase() },
            { email: String(userId).toLowerCase() },
          ],
        }).select('-password');
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'Token is valid but user no longer exists.',
        });
      }

      // Session / Token Version Invalidation Check for legacy tokens
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

      req.authProvider = 'local';
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
    const roleMigration = { student: 'user', developer: 'user', professor: 'teacher' };
    if (roleMigration[user.role]) {
      user.role = roleMigration[user.role];
      if (!Array.isArray(user.roles)) user.roles = [];
      if (!user.roles.includes(user.role)) user.roles.push(user.role);
      await User.updateOne(
        { _id: user._id },
        { $set: { role: user.role, roles: user.roles } }
      );
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
              etxId: user.etxId,
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
            etxId: user.etxId,
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
              etxId: user.etxId,
            },
          });
        }
      }
    }

  } catch (error) {
    console.error('[Protect Auth Middleware Error]:', error.message || error);

    // Differentiate between expired, malformed, and invalid tokens (always 401 Unauthorized)
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired. Please login again.',
      });
    }

    if (error.name === 'JsonWebTokenError' || error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Invalid token.',
      });
    }

    if (error.name === 'CastError') {
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN_IDENTIFIER',
        message: 'Invalid token user identifier.',
      });
    }

    return res.status(401).json({
      success: false,
      code: 'AUTH_FAILED',
      message: 'Authentication error. Please login again.',
    });
  }

  next();
};

module.exports = { protect };
