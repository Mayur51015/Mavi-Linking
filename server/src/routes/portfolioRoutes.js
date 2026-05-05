const express = require('express');
const { getPortfolio } = require('../controllers/portfolioController');

const router = express.Router();

// Public route to view any developer's portfolio
router.get('/:userId', getPortfolio);

module.exports = router;
