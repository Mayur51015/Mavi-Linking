const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const careerController = require('../controllers/careerController');

const router = express.Router();

// Get chronological timeline
router.get('/timeline/:userId', protect, careerController.getTimeline);

// Get Badges
router.get('/badges/:userId', protect, careerController.getBadges);

// Get AI Insights
router.get('/insights/:userId', protect, careerController.getInsights);

// Sync and recalculate profile manually
router.post('/sync-coding-profiles', protect, careerController.syncProfiles);

module.exports = router;
