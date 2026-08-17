/**
 * Centralized Administrator and User Invitation Configuration
 *
 * Provides authoritative calculation of invitation expiration and rate limiting
 * based on environment variables or default policies (24 hours).
 */

const getAdminInvitationExpiryHours = () => {
  const envVal = process.env.ADMIN_INVITATION_EXPIRY_HOURS;
  const parsed = parseInt(envVal, 10);
  return !isNaN(parsed) && parsed > 0 ? parsed : 24;
};

const getAdminInvitationExpiresAt = (fromDate = new Date()) => {
  const hours = getAdminInvitationExpiryHours();
  return new Date(new Date(fromDate).getTime() + hours * 3600 * 1000);
};

const getResendRateLimitConfig = () => {
  const maxAttempts = parseInt(process.env.ADMIN_INVITATION_RESEND_LIMIT || '5', 10);
  const windowMinutes = parseInt(process.env.ADMIN_INVITATION_RESEND_WINDOW_MINUTES || '60', 10);
  const cooldownSeconds = parseInt(process.env.ADMIN_INVITATION_RESEND_COOLDOWN_SECONDS || '60', 10);

  return {
    maxAttempts: isNaN(maxAttempts) ? 5 : maxAttempts,
    windowMinutes: isNaN(windowMinutes) ? 60 : windowMinutes,
    cooldownSeconds: isNaN(cooldownSeconds) ? 60 : cooldownSeconds,
  };
};

module.exports = {
  getAdminInvitationExpiryHours,
  getAdminInvitationExpiresAt,
  getResendRateLimitConfig,
};
