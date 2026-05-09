const express = require('express');
const { protect } = require('../middleware/auth');
const { getStudents, getReadiness, getLeaderboard } = require('../controllers/educationController');

const router = express.Router();

router.use(protect);

router.get('/students', getStudents);
router.get('/readiness', getReadiness);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
