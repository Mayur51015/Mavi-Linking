/**
 * Centralized OTP Expiration & Security Policy Configuration
 *
 * Enforces an authoritative 10-minute maximum lifetime for all One-Time Passwords (OTPs)
 * across every user role (Student, Teacher/Faculty, Recruiter, Institution Admin,
 * Department Admin, Admin, Super Admin, Platform Owner, Owner).
 */

const OTP_EXPIRY_MINUTES = 10;

/**
 * Return authoritative OTP expiration duration in minutes
 * @returns {number} 10
 */
const getOtpExpiryMinutes = () => {
  return OTP_EXPIRY_MINUTES;
};

/**
 * Calculate OTP expiration Date object: expiresAt = generatedAt + 10 minutes
 * @param {Date|number|string} [generatedAt=new Date()]
 * @returns {Date}
 */
const getOtpExpiresAt = (generatedAt = new Date()) => {
  const baseTime = generatedAt instanceof Date ? generatedAt.getTime() : new Date(generatedAt).getTime();
  return new Date(baseTime + OTP_EXPIRY_MINUTES * 60 * 1000);
};

/**
 * Authoritatively check if an OTP has expired against current server time.
 * Strict inequality: current server time >= expiration time is considered expired.
 * @param {Date|number|string|null} expiresAt
 * @param {Date|number} [now=Date.now()]
 * @returns {boolean} true if expired, missing, or invalid; false if strictly valid
 */
const isOtpExpired = (expiresAt, now = Date.now()) => {
  if (!expiresAt) return true;
  const expiryTime = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime();
  if (isNaN(expiryTime)) return true;
  const currentTime = now instanceof Date ? now.getTime() : typeof now === 'number' ? now : Date.now();
  return currentTime >= expiryTime;
};

module.exports = {
  OTP_EXPIRY_MINUTES,
  getOtpExpiryMinutes,
  getOtpExpiresAt,
  isOtpExpired,
};
