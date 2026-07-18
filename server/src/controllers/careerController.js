const TimelineEvent = require('../models/TimelineEvent');
const User = require('../models/User');
const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');

exports.getTimeline = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Ensure the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const events = await TimelineEvent.find({ user: userId }).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

exports.getBadges = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const Badge = require('../models/Badge');
    const badges = await Badge.find({ user: userId }).sort({ awardedAt: -1 });

    res.status(200).json({
      success: true,
      data: badges,
    });
  } catch (error) {
    next(error);
  }
};

exports.getInsights = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('aiAnalysis placementReadinessScore profileCompletion scores');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.syncProfiles = async (req, res, next) => {
  try {
    // Re-evaluate intelligence manually
    const user = await evaluateUserIntelligence(req.user._id);

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile synced and intelligence score updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
