const express = require('express');
const { protect } = require('../middleware/auth');
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

module.exports = router;
