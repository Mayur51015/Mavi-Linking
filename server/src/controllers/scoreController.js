const User = require('../models/User');
const { calculateAggregatedScores } = require('../services/scoreService');
const { generateInsights } = require('../services/insightService');
const {
  updateUserRanking,
  getLeaderboardPage,
} = require('../services/incrementalLeaderboardService');const { getProfileFreshness } = require('../services/syncConsistencyService');/**
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

await updateUserRanking(user);    
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

const { PRIVILEGED_ROLES, calculateScoreTier, calculateMedal } = require('../utils/leaderboardHelper');

/**
 * @desc    Get the global leaderboard (sorted by overall score with tie-breakers)
 * @route   GET /api/scores/leaderboard
 * @access  Public
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const limit = Math.min(
      parseInt(req.query.limit, 10) || 10,
      50
    );

    const page = parseInt(req.query.page, 10) || 1;

    const result = await getLeaderboardPage({
      page,
      limit,
      departmentId: req.query.departmentId || null,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    const query = {
      role: { $nin: PRIVILEGED_ROLES },
      status: { $ne: 'suspended' },
      'scores.overall': { $gt: 0 }
    };

    // Fetch all eligible non-privileged developers sorted with tie-breaker rules
    const allEligibleUsers = await User.find(query)
      .select('name avatar maviId scores role status platforms platformSync')      .sort({
        'scores.overall': -1,
        'scores.problemSolving': -1,
        'scores.development': -1,
        'maviId': 1,
        '_id': 1
      });

    // Map all eligible users to assign authoritative server-side rank, rank-based medal, and score tier
    const rankedList = allEligibleUsers.map((userObj, index) => {
      const rank = index + 1;
      const score = userObj.scores?.overall || 0;
      const medal = calculateMedal(rank);
      const scoreTier = calculateScoreTier(score);

      return {
        _id: userObj._id,
        rank,
        score,
        medal,
        scoreTier,
        scores: userObj.scores,
                freshness: getProfileFreshness(userObj),
        user: {
          _id: userObj._id,
          name: userObj.name,
          avatar: userObj.avatar,
          maviId: userObj.maviId,
          role: userObj.role,
          platforms: userObj.platforms
        }
      };
    });

    const paginatedLeaderboard = rankedList.slice(skip, skip + limit);
    const total = rankedList.length;

    res.status(200).json({
      success: true,
      data: {
        leaderboard: paginatedLeaderboard,
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
 * @desc    Get the current user's scores, rank, medal, and score tier
 * @route   GET /api/scores/me
 * @access  Private
 */
const getMyScores = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const overallScore = user.scores?.overall || 0;
    
    let rank = null;
    let medal = null;
    const scoreTier = calculateScoreTier(overallScore);

    if (overallScore > 0 && !PRIVILEGED_ROLES.includes(user.role) && user.status !== 'suspended') {
      const allEligibleUsers = await User.find({
        role: { $nin: PRIVILEGED_ROLES },
        status: { $ne: 'suspended' },
        'scores.overall': { $gt: 0 }
      })
      .select('maviId scores')
      .sort({
        'scores.overall': -1,
        'scores.problemSolving': -1,
        'scores.development': -1,
        'maviId': 1,
        '_id': 1
      });

      const userIndex = allEligibleUsers.findIndex(u => u._id.toString() === user._id.toString());
      if (userIndex !== -1) {
        rank = userIndex + 1;
        medal = calculateMedal(rank);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        scores: user.scores,
        rank,
        medal,
        scoreTier,
        freshness: getProfileFreshness(user)      }
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
