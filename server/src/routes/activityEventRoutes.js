const express = require('express');
const { getMyTimeline, getMyHistoricalState } = require('../controllers/activityEventController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/me/timeline', protect, getMyTimeline);
router.get('/me/history', protect, getMyHistoricalState);

module.exports = router;