const RecruitmentNotification = require('../models/RecruitmentNotification');

/**
 * Get notifications for a user (paginated, most recent first).
 */
const getNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const query = { recipientId: userId };
  if (unreadOnly) query.isRead = false;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    RecruitmentNotification.find(query)
      .populate('senderId', 'name companyName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    RecruitmentNotification.countDocuments(query),
    RecruitmentNotification.countDocuments({ recipientId: userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/**
 * Mark a single notification as read.
 */
const markAsRead = async (notificationId, userId) => {
  return RecruitmentNotification.findOneAndUpdate(
    { _id: notificationId, recipientId: userId },
    { $set: { isRead: true } },
    { new: true }
  );
};

/**
 * Mark all notifications as read for a user.
 */
const markAllAsRead = async (userId) => {
  return RecruitmentNotification.updateMany(
    { recipientId: userId, isRead: false },
    { $set: { isRead: true } }
  );
};

/**
 * Create a new notification and emit via socket.io
 */
const createNotification = async (data) => {
  const notification = await RecruitmentNotification.create(data);
  try {
    const { getIO } = require('../config/socket');
    const io = getIO();
    if (io) {
      io.to(data.recipientId.toString()).emit('notification', {
        ...notification.toObject(),
      });
    }
  } catch (err) {
    // Socket may not be initialized in tests — silently ignore
  }
  return notification;
};

const getUnreadCount = async (userId) => {
  return RecruitmentNotification.countDocuments({ recipientId: userId, isRead: false });
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  createNotification,
};
