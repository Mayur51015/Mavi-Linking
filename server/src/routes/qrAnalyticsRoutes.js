const express = require('express');
const { protect } = require('../middleware/auth');
const { getAnalytics } = require('../controllers/qrAnalyticsController');

const router = express.Router();

router.use(protect);

router.get('/', getAnalytics);

module.exports = router;
