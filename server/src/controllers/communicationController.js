const Message = require('../models/Message');
const User = require('../models/User');

exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;
    
    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: 'Receiver ID and content are required' });
    }
    
    const message = await Message.create({
      senderId: req.user.id,
      receiverId,
      content,
    });
    
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: userId },
        { senderId: userId, receiverId: req.user.id }
      ]
    }).sort({ createdAt: 1 });
    
    // Mark as read
    await Message.updateMany(
      { senderId: userId, receiverId: req.user.id, isRead: false },
      { isRead: true }
    );
    
    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
};

exports.getConversations = async (req, res, next) => {
  try {
    // Find all unique users this user has communicated with
    const messages = await Message.find({
      $or: [{ senderId: req.user.id }, { receiverId: req.user.id }]
    }).sort({ createdAt: -1 });
    
    const usersMap = new Map();
    
    messages.forEach(msg => {
      const otherId = msg.senderId.toString() === req.user.id ? msg.receiverId.toString() : msg.senderId.toString();
      if (!usersMap.has(otherId)) {
        usersMap.set(otherId, msg);
      }
    });
    
    const userIds = Array.from(usersMap.keys());
    const users = await User.find({ _id: { $in: userIds } }).select('name username avatar role');
    
    const conversations = users.map(user => {
      const lastMessage = usersMap.get(user._id.toString());
      return {
        user,
        lastMessage
      };
    });
    
    // Sort by last message date
    conversations.sort((a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt);
    
    res.status(200).json({ success: true, data: conversations });
  } catch (err) {
    next(err);
  }
};
