const express = require('express');
const { protect } = require('../middleware/auth');
const { compare, searchUsers } = require('../controllers/compatibilityController');

const router = express.Router();

router.use(protect);

router.get('/search', searchUsers);
router.post('/compare', compare);

module.exports = router;
