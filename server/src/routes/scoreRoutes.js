const express = require('express');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  calculateMyScores,
  getLeaderboard,
  getMyScores,
  getInsights
} = require('../controllers/scoreController');

const router = express.Router();

// Public route for leaderboard
router.get('/leaderboard', getLeaderboard);

// Protected routes for current user
router.post('/calculate', protect, calculateMyScores);
router.get('/me', protect, getMyScores);
router.get('/insights', protect, getInsights);

router.post(
  '/leaderboard/rebuild',
  protect,
  requireRole('admin', 'super_admin'),
  async (req, res, next) => {
    try {
      const { rebuildRankings } = require('../services/incrementalLeaderboardService');

      const result = await rebuildRankings();

      res.status(200).json({
        success: true,
        message: 'Leaderboard rankings rebuilt successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;