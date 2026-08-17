const rateLimit = require('express-rate-limit');

// Limiter for sensitive but lower-frequency auth actions (register, password
// reset, email verification, OAuth) to mitigate abuse and enumeration.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many attempts. Please try again after 15 minutes.',
  },
});

// Dedicated, stricter limiter for the login endpoint specifically, to guard
// against brute-force and credential-stuffing attacks. Successful logins
// don't count against the limit, so legitimate users who eventually enter
// the right password aren't penalized.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

module.exports = { authLimiter, loginLimiter };