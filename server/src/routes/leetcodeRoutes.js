const express = require('express');
const { syncLeetCode, getMyLeetCode, getLeetCodeByUsername } = require('../controllers/leetcodeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/sync', protect, syncLeetCode);
router.get('/me', protect, getMyLeetCode);
router.get('/:username', getLeetCodeByUsername);

module.exports = router;
