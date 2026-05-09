const express = require('express');
const { protect } = require('../middleware/auth');
const { compare } = require('../controllers/compatibilityController');

const router = express.Router();

router.use(protect);

router.post('/compare', compare);

module.exports = router;
