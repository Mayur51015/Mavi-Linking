const rateLimit = require('express-rate-limit');

// Global API rate limiter — 1000 requests per 15 minutes per IP.
// Auth endpoints layer a much stricter limiter on top of this (see
// authLimiter.js) since they need tighter protection than the rest of the API.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.',
  },
});

module.exports = apiLimiter;