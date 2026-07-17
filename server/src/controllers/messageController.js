const Message = require('../models/Message');
const User = require('../models/User');

/**
 * @desc    Get all conversations for the logged-in user
 * @route   GET /api/messages
 * @access  Private
 */
const getConversations = async (req, res, next) => {
  try {
    const messages = await Message.find({
      $or: [{ senderId: req.user.id }, { recipientId: req.user.id }],
    }).sort({ createdAt: -1 });

    const conversationMap = {};
    for (const msg of messages) {
      const otherUserId = msg.senderId.toString() === req.user.id ? msg.recipientId.toString() : msg.senderId.toString();
      if (!conversationMap[otherUserId]) {
        conversationMap[otherUserId] = msg;
      }
    }

    const userIds = Object.keys(conversationMap);
    const users = await User.find({ _id: { $in: userIds } }).select('name username avatar role companyName');

    const conversations = users.map(user => {
      const lastMsg = conversationMap[user._id.toString()];
      return {
        user,
        lastMessage: lastMsg,
      };
    }).sort((a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt);

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get chat history between current user and specified user
 * @route   GET /api/messages/:userId
 * @access  Private
 */
const getChatHistory = async (req, res, next) => {
  try {
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: req.user.id },
      ],
    }).sort({ createdAt: 1 });

    // Mark incoming messages as read
    await Message.updateMany(
      { senderId: otherUserId, recipientId: req.user.id, status: { $ne: 'read' } },
      { $set: { status: 'read' } }
    );

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send a message
 * @route   POST /api/messages
 * @access  Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const { recipientId, content } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({ success: false, message: 'Recipient ID and content are required' });
    }

    const msg = await Message.create({
      senderId: req.user.id,
      recipientId,
      content,
      status: 'sent',
    });

    // Real-time notification via Socket.io
    try {
      const { getIO } = require('../config/socket');
      const io = getIO();
      if (io) {
        io.to(recipientId.toString()).emit('new_message', msg);
      }
    } catch (err) {
      // Socket not initialized in testing
    }

    res.status(201).json({
      success: true,
      data: msg,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getChatHistory,
  sendMessage,
};
