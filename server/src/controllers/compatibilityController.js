const { compareUsers } = require('../services/compatibilityService');
const User = require('../models/User');

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
/**
 * @desc    Search users by name/username for compatibility picker
 * @route   GET /api/compatibility/search?q=...
 * @access  Private
 */
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    const regex = new RegExp(q.trim(), 'i');
    const users = await User.find({
      role: 'user',
      _id: { $ne: req.user._id },
      $or: [
        { name: regex },
        { username: regex },
        { 'platforms.github.username': regex },
      ],
    })
      .select('name username avatar scores university isVerified')
      .limit(10)
      .sort({ 'scores.overall': -1 });

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

module.exports = { compare, searchUsers };
