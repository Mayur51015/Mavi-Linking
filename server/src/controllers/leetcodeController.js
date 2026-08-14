const LeetCodeAnalytics = require('../models/LeetCodeAnalytics');
const User = require('../models/User');
const { fetchLeetCodeData } = require('../services/leetcodeService');

const syncLeetCode = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username || !String(username).trim()) {
      return res.status(400).json({ success: false, message: 'LeetCode username is required' });
    }

    const cleanUsername = String(username).trim();
    const userId = req.user.id;
    
    // Fetch from API
    const data = await fetchLeetCodeData(cleanUsername);

    // Update User schema
    await User.findByIdAndUpdate(userId, {
      'platforms.leetcode.username': cleanUsername,
      'platforms.leetcode.linkedAt': new Date(),
      'platformData.leetcode': {
        solved: data.totalSolved,
        solvedEasy: data.easySolved,
        solvedMedium: data.mediumSolved,
        solvedHard: data.hardSolved,
        ranking: data.ranking
      }
    });

    // Update or Create Analytics
    const analyticsData = {
      user: userId,
      username,
      ranking: data.ranking,
      totalSolved: data.totalSolved,
      easySolved: data.easySolved,
      mediumSolved: data.mediumSolved,
      hardSolved: data.hardSolved,
      contestRating: data.contestRating,
      contributionPoints: data.contributionPoints,
      reputation: data.reputation,
      badges: data.badges,
      recentSubmissions: data.recentSubmissions,
      ...(data.aiInsight && { aiInsight: data.aiInsight })
    };

    const analytics = await LeetCodeAnalytics.findOneAndUpdate(
      { user: userId },
      { $set: analyticsData },
      { new: true, upsert: true }
    );

    // Log activity feed & emit real-time Socket.IO event
    try {
      const Activity = require('../models/Activity');
      const { getIO } = require('../config/socket');
      const activity = await Activity.create({
        userId,
        type: 'LeetCode',
        title: 'LeetCode Profile Synced',
        description: `Synced ${data.totalSolved || 0} solved problems (${data.easySolved || 0} Easy, ${data.mediumSolved || 0} Medium, ${data.hardSolved || 0} Hard)`,
        platform: 'leetcode',
      });
      const io = getIO();
      if (io) io.to(userId.toString()).emit('new_activity', activity);
    } catch (actErr) {
      console.warn('Activity log for LeetCode sync skipped:', actErr.message);
    }

    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    console.error(`LeetCode sync failed for user ${req.user?.id}:`, error.message);
    const msg = error.message || 'LeetCode synchronization failed.';
    const isUpstream = msg.includes('temporarily unavailable') || msg.includes('API failed');
    return res.status(isUpstream ? 502 : 400).json({ success: false, message: msg });
  }
};

const getMyLeetCode = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const analytics = await LeetCodeAnalytics.findOne({ user: userId });
    
    if (!analytics) {
      return res.status(200).json({ success: true, data: null, synced: false, message: 'LeetCode profile not synced yet.' });
    }

    res.status(200).json({ success: true, data: analytics, synced: true });
  } catch (error) {
    next(error);
  }
};

const getLeetCodeByUsername = async (req, res, next) => {
  try {
    const { username } = req.params;
    const analytics = await LeetCodeAnalytics.findOne({ username });

    if (!analytics) {
      return res.status(404).json({ success: false, message: 'LeetCode data not found for this username.' });
    }

    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncLeetCode,
  getMyLeetCode,
  getLeetCodeByUsername
};
