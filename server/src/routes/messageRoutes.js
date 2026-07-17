const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getConversations,
  getChatHistory,
  sendMessage,
} = require('../controllers/messageController');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getConversations)
  .post(sendMessage);

router.get('/:userId', getChatHistory);

module.exports = router;
