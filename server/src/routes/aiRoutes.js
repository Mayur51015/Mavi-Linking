const express = require('express');
const { protect } = require('../middleware/auth');
const aiController = require('../controllers/aiController');

const router = express.Router();

router.use(protect);

router.get('/insights', aiController.getInsights);
router.post('/insights/generate', aiController.generateNewInsights);

router.get('/dna', aiController.getDNA);

router.get('/ranking', aiController.getRanking);
router.get('/ranking/leaderboard', aiController.getLeaderboard);

router.get('/analytics', aiController.getAnalytics);

router.get('/activities', aiController.getActivities);
router.post('/activities', aiController.logActivity);

router.get('/report/generate', aiController.generateReport);

module.exports = router;
