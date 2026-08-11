const rateLimit = require('express-rate-limit');

// Stricter limiter for authentication endpoints (login/register/password reset)
// to mitigate brute-force, credential stuffing, and account enumeration attacks.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again after 15 minutes.',
  },
});

module.exports = authLimiter;
