const express = require('express');
const { protect } = require('../middleware/auth');
const {
  sendMessage,
  getConversations,
  getMessages
} = require('../controllers/communicationController');

const router = express.Router();

router.use(protect);

router.post('/', sendMessage);
router.get('/conversations', getConversations);
router.get('/:userId', getMessages); // get messages with a specific user

module.exports = router;
