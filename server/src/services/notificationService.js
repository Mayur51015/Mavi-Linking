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

  // If email dispatch is requested, resolve recipient email server-side and send
  if (data.sendEmail) {
    try {
      const User = require('../models/User');
      const recipientUser = await User.findById(data.recipientId).select('email name');
      if (!recipientUser || !recipientUser.email) {
        throw new Error(`Cannot send notification email: recipient email could not be resolved for user ID ${data.recipientId}`);
      }
      const { sendEmail } = require('../utils/sendEmail');
      await sendEmail({
        to: recipientUser.email,
        recipientUserId: data.recipientId,
        actorUserId: data.senderId,
        subject: data.title || 'EduTalentX Notification',
        html: `
          <div style="font-family: Arial, sans-serif; background: #0d1117; color: #f0f6fc; padding: 24px; border-radius: 8px;">
            <h2 style="color: #6366f1; margin-top: 0;">${data.title || 'EduTalentX Notification'}</h2>
            <p>Hello <strong>${recipientUser.name || 'User'}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6; color: #c9d1d9;">${data.message || ''}</p>
            ${data.link ? `<div style="margin-top: 20px;"><a href="${data.link}" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">View in Portal</a></div>` : ''}
          </div>
        `,
        templateName: `notification-${data.type || 'general'}`,
      });
    } catch (emailErr) {
      console.error('[NOTIFICATION EMAIL DISPATCH ERROR]', emailErr.message);
      if (data.throwOnEmailFailure) throw emailErr;
    }
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

