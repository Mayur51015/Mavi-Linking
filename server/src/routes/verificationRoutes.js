const express = require('express');
const { protect } = require('../middleware/auth');
const { generate, verify, status } = require('../controllers/verificationController');

const router = express.Router();

router.use(protect);

router.post('/generate', generate);
router.post('/verify', verify);
router.get('/status', status);

module.exports = router;
