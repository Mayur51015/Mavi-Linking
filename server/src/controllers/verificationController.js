const {
  generateVerificationCode,
  verifyGitHubBio,
  getVerificationStatus,
} = require('../services/verificationService');

/**
 * @desc    Generate a verification code
 * @route   POST /api/verification/generate
 * @access  Private
 */
const generate = async (req, res, next) => {
  try {
    const verification = await generateVerificationCode(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Verification code generated. Add it to your GitHub bio within 24 hours.',
      data: {
        code: verification.code,
        expiresAt: verification.expiresAt,
        instructions: [
          `1. Copy the code: ${verification.code}`,
          '2. Go to https://github.com/settings/profile',
          '3. Paste the code anywhere in your bio',
          '4. Save your profile',
          '5. Come back and click "Verify"',
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify GitHub bio contains the code
 * @route   POST /api/verification/verify
 * @access  Private
 */
const verify = async (req, res, next) => {
  try {
    const result = await verifyGitHubBio(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get verification status
 * @route   GET /api/verification/status
 * @access  Private
 */
const status = async (req, res, next) => {
  try {
    const result = await getVerificationStatus(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { generate, verify, status };
