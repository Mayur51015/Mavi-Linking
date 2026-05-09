const crypto = require('crypto');
const Verification = require('../models/Verification');
const User = require('../models/User');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

/**
 * Generate a unique verification code for a user.
 * User must place this code in their GitHub bio to verify.
 */
const generateVerificationCode = async (userId) => {
  const code = `mavi-verify-${crypto.randomBytes(6).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const verification = await Verification.findOneAndUpdate(
    { userId },
    {
      userId,
      code,
      platform: 'github',
      status: 'pending',
      attempts: 0,
      verifiedAt: null,
      expiresAt,
    },
    { new: true, upsert: true }
  );

  return verification;
};

/**
 * Verify that the user's GitHub bio contains their verification code.
 */
const verifyGitHubBio = async (userId) => {
  const verification = await Verification.findOne({ userId, status: 'pending' });
  if (!verification) {
    throw new Error('No pending verification found. Please generate a code first.');
  }

  if (new Date() > verification.expiresAt) {
    verification.status = 'expired';
    await verification.save();
    throw new Error('Verification code has expired. Please generate a new one.');
  }

  verification.attempts += 1;

  // Get user's GitHub username
  const user = await User.findById(userId);
  const githubUsername = user?.platforms?.github?.username;
  if (!githubUsername) {
    throw new Error('GitHub account is not linked. Please link your GitHub first.');
  }

  // Fetch GitHub bio
  const headers = { Accept: 'application/vnd.github+json' };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  const response = await fetch(
    `https://api.github.com/users/${encodeURIComponent(githubUsername)}`,
    { headers }
  );
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Unable to fetch GitHub profile for verification.');
  }

  const bio = (payload.bio || '').toLowerCase();
  const codeFound = bio.includes(verification.code.toLowerCase());

  if (codeFound) {
    verification.status = 'verified';
    verification.verifiedAt = new Date();
    await verification.save();

    // Mark user as verified
    await User.findByIdAndUpdate(userId, {
      isVerified: true,
      verificationCode: verification.code,
    });

    return { verified: true, message: 'GitHub account verified successfully!' };
  }

  await verification.save();
  return {
    verified: false,
    message: `Verification code not found in your GitHub bio. Attempt ${verification.attempts}. Please add "${verification.code}" to your GitHub bio and try again.`,
  };
};

/**
 * Get the current verification status for a user.
 */
const getVerificationStatus = async (userId) => {
  const verification = await Verification.findOne({ userId }).sort({ createdAt: -1 });
  const user = await User.findById(userId).select('isVerified');

  return {
    isVerified: user?.isVerified || false,
    verification: verification
      ? {
          code: verification.code,
          status: verification.status,
          attempts: verification.attempts,
          expiresAt: verification.expiresAt,
          verifiedAt: verification.verifiedAt,
        }
      : null,
  };
};

module.exports = {
  generateVerificationCode,
  verifyGitHubBio,
  getVerificationStatus,
};
