/**
 * Centralized Security Token & Email Link Expiration Configuration
 *
 * Enforces authoritative 10-minute maximum lifetime for all security-sensitive
 * email verification, account activation, administrative invitation, password setup,
 * password reset, and email change tokens across MAVI Linking.
 */

const DEFAULT_SECURITY_TOKEN_EXPIRY_MINUTES = 10;

/**
 * Get configured token expiry duration in minutes
 * @returns {number} 10 minutes (or process.env.SECURITY_TOKEN_EXPIRY_MINUTES if defined)
 */
const getSecurityTokenExpiryMinutes = () => {
  const envVal = process.env.SECURITY_TOKEN_EXPIRY_MINUTES || process.env.ADMIN_INVITATION_EXPIRY_MINUTES;
  const parsed = parseInt(envVal, 10);
  return !isNaN(parsed) && parsed > 0 ? parsed : DEFAULT_SECURITY_TOKEN_EXPIRY_MINUTES;
};

/**
 * Calculate token expiration Date object (Current Time + 10 Minutes)
 * @param {Date|number|string} [fromDate=new Date()]
 * @returns {Date}
 */
const getSecurityTokenExpiresAt = (fromDate = new Date()) => {
  const minutes = getSecurityTokenExpiryMinutes();
  const baseTime = fromDate instanceof Date ? fromDate.getTime() : new Date(fromDate).getTime();
  return new Date(baseTime + minutes * 60 * 1000);
};

/**
 * Authoritatively check if a token timestamp has expired against the current server time
 * @param {Date|number|string|null} expiresAt
 * @param {Date|number} [now=Date.now()]
 * @returns {boolean} true if expired or missing, false if still valid
 */
const isTokenExpired = (expiresAt, now = Date.now()) => {
  if (!expiresAt) return true;
  const expiryTime = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime();
  if (isNaN(expiryTime)) return true;
  const currentTime = now instanceof Date ? now.getTime() : typeof now === 'number' ? now : Date.now();
  return currentTime >= expiryTime;
};

/**
 * Resend Rate-Limiting Configuration (60s minimum cooldown between email dispatches)
 */
const getResendRateLimitConfig = () => {
  const maxAttempts = parseInt(process.env.RESEND_RATE_LIMIT_MAX_ATTEMPTS || '5', 10);
  const cooldownSeconds = parseInt(process.env.RESEND_RATE_LIMIT_COOLDOWN_SECONDS || '60', 10);
  const windowMinutes = parseInt(process.env.RESEND_RATE_LIMIT_WINDOW_MINUTES || '60', 10);

  return {
    maxAttempts: isNaN(maxAttempts) ? 5 : maxAttempts,
    cooldownSeconds: isNaN(cooldownSeconds) ? 60 : cooldownSeconds,
    windowMinutes: isNaN(windowMinutes) ? 60 : windowMinutes,
  };
};

module.exports = {
  DEFAULT_SECURITY_TOKEN_EXPIRY_MINUTES,
  getSecurityTokenExpiryMinutes,
  getSecurityTokenExpiresAt,
  isTokenExpired,
  getResendRateLimitConfig,
};
