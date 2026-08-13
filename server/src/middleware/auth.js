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

    // A password reset revokes every session issued before it, so a token that
    // predates the last reset is refused even though its signature is valid.
    if (user.isTokenStale(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Session expired because the account password was changed. Please login again.',
      });
    }

    // ─── Backward Compatibility: migrate old role names ─────────────
    const roleMigration = { developer: 'user', professor: 'teacher' };
    if (roleMigration[user.role]) {
      user.role = roleMigration[user.role];
      await User.updateOne({ _id: user._id }, { $set: { role: user.role } });
    }

    req.user = user;
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
