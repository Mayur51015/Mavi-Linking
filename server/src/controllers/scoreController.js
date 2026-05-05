const User = require('../models/User');
const { calculateAggregatedScores } = require('../services/scoreService');
const { generateInsights } = require('../services/insightService');

/**
 * @desc    Calculate and update scores for the authenticated user
 * @route   POST /api/scores/calculate
 * @access  Private
 */
const calculateMyScores = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Calculate new scores using the cached platformData
    const newScores = calculateAggregatedScores(user.platformData);
    
    // Update user document
    user.scores = newScores;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Scores calculated successfully',
      data: {
        scores: newScores
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the global leaderboard (sorted by overall score)
 * @route   GET /api/scores/leaderboard
 * @access  Public
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    // Fetch users with overall score > 0, sorted descending
    const users = await User.find({ 'scores.overall': { $gt: 0 } })
      .select('name avatar scores platforms.github.username platforms.codeforces.username platforms.leetcode.username platforms.stackoverflow.username')
      .sort({ 'scores.overall': -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ 'scores.overall': { $gt: 0 } });

    res.status(200).json({
      success: true,
      data: {
        leaderboard: users,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the current user's scores and rank
 * @route   GET /api/scores/me
 * @access  Private
 */
const getMyScores = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Calculate user's global rank based on overall score
    let rank = null;
    if (user.scores && user.scores.overall > 0) {
      // Rank is the number of people with a strictly greater score + 1
      const higherScoresCount = await User.countDocuments({
        'scores.overall': { $gt: user.scores.overall }
      });
      rank = higherScoresCount + 1;
    }

    res.status(200).json({
      success: true,
      data: {
        scores: user.scores,
        rank
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate AI insights based on the user's platform data
 * @route   GET /api/scores/insights
 * @access  Private
 */
const getInsights = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Ensure they have at least one platform linked before generating insights
    if (!user.scores || user.scores.overall === 0) {
      return res.status(400).json({
        success: false,
        message: 'No platform data available to generate insights. Please link at least one account first.'
      });
    }

    try {
      const insights = await generateInsights(user);
      res.status(200).json({
        success: true,
        data: {
          insights
        }
      });
    } catch (aiError) {
      console.error('AI Insight generation failed:', aiError.message);
      return res.status(503).json({
        success: false,
        message: 'AI service is temporarily unavailable. Please check your OpenAI API key or try again later.'
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculateMyScores,
  getLeaderboard,
  getMyScores,
  getInsights
};
