/**
 * Centralized Administrator and User Invitation Configuration
 *
 * Provides authoritative calculation of invitation expiration (10 minutes)
 * and rate limiting based on centralized security policies.
 */

const {
  getSecurityTokenExpiryMinutes,
  getSecurityTokenExpiresAt,
  getResendRateLimitConfig,
} = require('./securityTokenConfig');

const getAdminInvitationExpiryMinutes = () => {
  return getSecurityTokenExpiryMinutes();
};

const getAdminInvitationExpiryHours = () => {
  // Return minutes / 60 or minutes as formatted string/number for backward compatibility
  const minutes = getSecurityTokenExpiryMinutes();
  return minutes;
};

const getAdminInvitationExpiresAt = (fromDate = new Date()) => {
  return getSecurityTokenExpiresAt(fromDate);
};

module.exports = {
  getAdminInvitationExpiryMinutes,
  getAdminInvitationExpiryHours,
  getAdminInvitationExpiresAt,
  getResendRateLimitConfig,
};
