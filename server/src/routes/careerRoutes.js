const express = require('express');
const { protect } = require('../middleware/auth');
const careerController = require('../controllers/careerController');

const router = express.Router();

router.use(protect);

// Standard endpoints
router.get('/dashboard', careerController.getDashboard);
router.get('/score', careerController.getScore);
router.get('/timeline', careerController.getTimeline);
router.get('/badges', careerController.getBadges);
router.get('/insights', careerController.getInsights);
router.get('/dna', careerController.getDNA);
router.get('/skills', careerController.getSkills);
router.get('/analytics', careerController.getAnalytics);
router.get('/analysis', careerController.getAnalysis);
router.post('/recalculate', careerController.recalculate);
router.post('/analyze', careerController.analyze);

// Legacy/Param-based endpoints for back compatibility / cross-profile checks
router.get('/timeline/:userId', careerController.getTimeline);
router.get('/badges/:userId', careerController.getBadges);
router.get('/insights/:userId', careerController.getInsights);
router.get('/dna/:userId', careerController.getDNA);
router.get('/skills/:userId', careerController.getSkills);
router.get('/analytics/:userId', careerController.getAnalytics);
router.get('/analysis/:userId', careerController.getAnalysis);
router.post('/sync-coding-profiles', careerController.syncProfiles);

// MAVI Career Roadmap Endpoints
router.get('/roadmap', careerController.getRoadmap);
router.get('/career-roadmap', careerController.getRoadmap);
router.post('/roadmap/generate', careerController.generateRoadmap);
router.post('/career-roadmap/generate', careerController.generateRoadmap);
router.put('/roadmap/progress', careerController.updateProgress);
router.put('/career-roadmap/progress', careerController.updateProgress);
router.put('/target-role', careerController.updateTargetGoal);
router.put('/goal', careerController.updateTargetGoal);
router.put('/career-goal', careerController.updateTargetGoal);
router.get('/skill-gap', careerController.getSkillGaps);

module.exports = router;

