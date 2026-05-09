const { compareUsers } = require('../services/compatibilityService');

/**
 * @desc    Compare developers for team compatibility
 * @route   POST /api/compatibility/compare
 * @access  Private
 */
const compare = async (req, res, next) => {
  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 2 user IDs to compare.',
      });
    }

    const result = await compareUsers(userIds);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { compare };
