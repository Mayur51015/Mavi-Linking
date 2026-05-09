const User = require('../models/User');

const normalizeUsername = (s) => (s || '').toString().trim().toLowerCase();

const getMetaByUsername = async (req, res, next) => {
  try {
    const username = normalizeUsername(req.params.username);

    const user = await User.findOne({
      $or: [
        { 'platforms.github.username': username },
        { 'platforms.leetcode.username': username },
        { 'platforms.codeforces.username': username },
        { 'platforms.stackoverflow.username': username },
      ],
    }).select('-password -__v -email');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Developer profile not found' });
    }

    const appBaseUrl = process.env.PUBLIC_APP_URL || process.env.CLIENT_URL || 'http://localhost:5173';
    const url = `${appBaseUrl}/u/${encodeURIComponent(username)}`;
    const title = `${user.name} • MaVi Linking`;

    // Minimal OG data: avatar if available
    const description = user.platformData?.github?.bio
      ? user.platformData.github.bio.slice(0, 160)
      : 'Technical identity powered by AI developer intelligence.';

    res.status(200).json({
      success: true,
      data: {
        url,
        title,
        description,
        image: user.avatar || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMetaByUsername,
};

