const crypto = require('crypto');

/**
 * Helpers for single-use, emailed credentials (password reset, email
 * verification).
 *
 * The pattern is the standard one: the raw token is handed to the user and
 * only ever exists in transit, while the database stores its SHA-256 digest.
 * A leaked database row is then useless on its own — you cannot reverse the
 * digest back into something `POST /api/auth/reset-password` will accept.
 *
 * SHA-256 without a salt is deliberate here (and is what bcrypt would be wrong
 * for): these tokens are 32 bytes of CSPRNG output, so there is no dictionary
 * to attack and no benefit to a slow KDF.
 */

const TOKEN_BYTES = 32;

/**
 * Hash a raw token for storage or lookup.
 *
 * @param {string} rawToken
 * @returns {string} lowercase hex digest
 */
const hashToken = (rawToken) =>
  crypto.createHash('sha256').update(String(rawToken)).digest('hex');

/**
 * Mint a new single-use token.
 *
 * @returns {{ rawToken: string, hashedToken: string }} `rawToken` goes to the
 *   user, `hashedToken` goes in the database.
 */
const createHashedToken = () => {
  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString('hex');
  return { rawToken, hashedToken: hashToken(rawToken) };
};

/**
 * Constant-time comparison for two hex digests, so a caller comparing hashes
 * in application code doesn't reintroduce a timing side channel.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
const safeCompare = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

module.exports = { hashToken, createHashedToken, safeCompare, TOKEN_BYTES };
