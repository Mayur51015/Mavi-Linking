const RecruitmentNotification = require('../models/RecruitmentNotification');

/**
 * Infer notification category from its type if not explicitly supplied
 */
const inferCategory = (type = 'general') => {
  if (['account_activated', 'account_verified', 'password_changed'].includes(type)) return 'account';
  if (['institution_verified'].includes(type)) return 'institution';
  if (['career_match_updated', 'roadmap_updated', 'profile_strength_updated'].includes(type)) return 'career';
  if (['github_sync', 'platform_sync'].includes(type)) return 'platform';
  if (['project_updated'].includes(type)) return 'project';
  if ([
    'pipeline_started',
    'status_update',
    'interview_scheduled',
    'offer_received',
    'offer_accepted',
    'placement_confirmed',
  ].includes(type)) return 'placement';
  if (['system_announcement'].includes(type)) return 'system';
  return 'general';
};

/**
 * Get notifications for a user (paginated, most recent first, filterable by category and search term).
 */
const getNotifications = async (userId, {
  page = 1,
  limit = 20,
  unreadOnly = false,
  category = 'all',
  search = '',
} = {}) => {
  const query = { recipientId: userId };
  if (unreadOnly) query.isRead = false;

  if (category && category !== 'all') {
    query.category = category;
  }

  if (search && typeof search === 'string' && search.trim()) {
    const term = search.trim();
    query.$or = [
      { title: { $regex: term, $options: 'i' } },
      { message: { $regex: term, $options: 'i' } },
    ];
  }

  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit) || 20));
  const parsedPage = Math.max(1, parseInt(page) || 1);
  const skip = (parsedPage - 1) * parsedLimit;

  const [notifications, total, unreadCount] = await Promise.all([
    RecruitmentNotification.find(query)
      .populate('senderId', 'name companyName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    RecruitmentNotification.countDocuments(query),
    RecruitmentNotification.countDocuments({ recipientId: userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.ceil(total / parsedLimit) || 1,
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
 * Delete a specific notification for a user.
 */
const deleteNotification = async (notificationId, userId) => {
  return RecruitmentNotification.findOneAndDelete({
    _id: notificationId,
    recipientId: userId,
  });
};

/**
 * Clear all read notifications for a user.
 */
const clearReadNotifications = async (userId) => {
  return RecruitmentNotification.deleteMany({
    recipientId: userId,
    isRead: true,
  });
};

/**
 * Create a new notification with duplicate suppression and emit via socket.io
 */
const createNotification = async (data) => {
  const category = data.category || inferCategory(data.type);
  const payload = {
    ...data,
    category,
  };

  // Prevent rapid duplicate notifications within 60 seconds
  if (data.recipientId && data.type && data.title) {
    const recentDuplicate = await RecruitmentNotification.findOne({
      recipientId: data.recipientId,
      type: data.type,
      title: data.title,
      createdAt: { $gte: new Date(Date.now() - 60000) },
    });
    if (recentDuplicate) {
      return recentDuplicate;
    }
  }

  const notification = await RecruitmentNotification.create(payload);
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
  deleteNotification,
  clearReadNotifications,
  getUnreadCount,
  createNotification,
  inferCategory,
};

