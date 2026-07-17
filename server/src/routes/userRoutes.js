const express = require('express');
const { protect } = require('../middleware/auth');
const { getUsersByRole, getUserById } = require('../controllers/userController');

const router = express.Router();

router.use(protect);

router.get('/', getUsersByRole);
router.get('/:id', getUserById);

module.exports = router;
