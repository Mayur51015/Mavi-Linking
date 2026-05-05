const User = require('../models/User');
const Project = require('../models/Project');

/**
 * @desc    Get public developer portfolio by user ID
 * @route   GET /api/portfolio/:userId
 * @access  Public
 */
const getPortfolio = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -__v -email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Developer portfolio not found',
      });
    }

    // Fetch user's projects
    const projects = await Project.find({ user: user._id })
      .select('-user -__v -updatedAt')
      .sort({ featured: -1, createdAt: -1 });

    // Clean up platform data for public consumption (remove raw large payloads if necessary, 
    // but for now we can just return the aggregated stats we care about).
    const publicProfile = {
      profile: {
        id: user._id,
        name: user.name,
        avatar: user.avatar,
      },
      scores: user.scores,
      platforms: user.platforms,
      projects,
      stats: {
        github: user.platformData?.github ? {
          publicRepos: user.platformData.github.publicRepos,
          followers: user.platformData.github.followers,
          company: user.platformData.github.company,
        } : null,
        leetcode: user.platformData?.leetcode ? {
          solved: user.platformData.leetcode.solved,
          easy: user.platformData.leetcode.solvedEasy,
          medium: user.platformData.leetcode.solvedMedium,
          hard: user.platformData.leetcode.solvedHard,
        } : null,
        codeforces: user.platformData?.codeforces ? {
          rating: user.platformData.codeforces.rating,
          rank: user.platformData.codeforces.rank,
        } : null,
        stackoverflow: user.platformData?.stackoverflow ? {
          reputation: user.platformData.stackoverflow.reputation,
          badges: {
            gold: user.platformData.stackoverflow.goldBadges,
            silver: user.platformData.stackoverflow.silverBadges,
            bronze: user.platformData.stackoverflow.bronzeBadges,
          }
        } : null
      }
    };

    res.status(200).json({
      success: true,
      data: publicProfile,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Developer portfolio not found',
      });
    }
    next(error);
  }
};

module.exports = {
  getPortfolio,
};
