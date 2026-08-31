const {
  inferCategory,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  getUnreadCount,
  createNotification,
} = require('../src/services/notificationService');
const RecruitmentNotification = require('../src/models/RecruitmentNotification');

jest.mock('../src/models/RecruitmentNotification');

describe('Notification Service Unit Tests', () => {
  const mockUserId1 = '507f1f77bcf86cd799439011';
  const mockUserId2 = '507f1f77bcf86cd799439022';
  const mockNotificationId = '507f1f77bcf86cd799439033';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('inferCategory', () => {
    test('correctly infers categories based on notification type', () => {
      expect(inferCategory('account_verified')).toBe('account');
      expect(inferCategory('password_changed')).toBe('account');
      expect(inferCategory('institution_verified')).toBe('institution');
      expect(inferCategory('career_match_updated')).toBe('career');
      expect(inferCategory('roadmap_updated')).toBe('career');
      expect(inferCategory('github_sync')).toBe('platform');
      expect(inferCategory('platform_sync')).toBe('platform');
      expect(inferCategory('project_updated')).toBe('project');
      expect(inferCategory('pipeline_started')).toBe('placement');
      expect(inferCategory('interview_scheduled')).toBe('placement');
      expect(inferCategory('offer_received')).toBe('placement');
      expect(inferCategory('system_announcement')).toBe('system');
      expect(inferCategory('unknown_type')).toBe('general');
    });
  });

  describe('createNotification', () => {
    test('creates notification and infers category when omitted', async () => {
      RecruitmentNotification.findOne.mockResolvedValue(null);
      RecruitmentNotification.create.mockImplementation(async (doc) => ({
        _id: mockNotificationId,
        ...doc,
        toObject: () => ({ _id: mockNotificationId, ...doc }),
      }));

      const notification = await createNotification({
        recipientId: mockUserId1,
        type: 'institution_verified',
        title: 'Institutional PRN Verified! 🎉',
        message: 'Your institutional identity has been approved.',
      });

      expect(notification.category).toBe('institution');
      expect(RecruitmentNotification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: mockUserId1,
          type: 'institution_verified',
          category: 'institution',
          title: 'Institutional PRN Verified! 🎉',
        })
      );
    });

    test('suppresses rapid duplicate notifications within timeframe', async () => {
      const existing = {
        _id: mockNotificationId,
        recipientId: mockUserId1,
        type: 'github_sync',
        title: 'GitHub Synced',
      };
      RecruitmentNotification.findOne.mockResolvedValue(existing);

      const result = await createNotification({
        recipientId: mockUserId1,
        type: 'github_sync',
        title: 'GitHub Synced',
      });

      expect(result).toBe(existing);
      expect(RecruitmentNotification.create).not.toHaveBeenCalled();
    });
  });

  describe('getNotifications & user isolation', () => {
    test('fetches notifications scoped strictly to the recipient user with pagination', async () => {
      const mockList = [
        {
          _id: 'n1',
          recipientId: mockUserId1,
          title: 'PRN Verified',
          category: 'institution',
          isRead: false,
          createdAt: new Date(),
        },
      ];

      const chain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockList),
      };

      RecruitmentNotification.find.mockReturnValue(chain);
      RecruitmentNotification.countDocuments
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1); // unreadCount

      const res = await getNotifications(mockUserId1, {
        page: 1,
        limit: 10,
        category: 'institution',
        search: 'PRN',
      });

      expect(RecruitmentNotification.find).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: mockUserId1,
          category: 'institution',
          $or: expect.arrayContaining([
            { title: { $regex: 'PRN', $options: 'i' } },
            { message: { $regex: 'PRN', $options: 'i' } },
          ]),
        })
      );
      expect(res.notifications).toEqual(mockList);
      expect(res.unreadCount).toBe(1);
      expect(res.pagination.total).toBe(1);
      expect(res.pagination.pages).toBe(1);
    });
  });

  describe('read state & management', () => {
    test('marks single notification as read', async () => {
      RecruitmentNotification.findOneAndUpdate.mockResolvedValue({
        _id: mockNotificationId,
        recipientId: mockUserId1,
        isRead: true,
      });

      const res = await markAsRead(mockNotificationId, mockUserId1);
      expect(RecruitmentNotification.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockNotificationId, recipientId: mockUserId1 },
        { $set: { isRead: true } },
        { new: true }
      );
      expect(res.isRead).toBe(true);
    });

    test('marks all notifications as read for user', async () => {
      RecruitmentNotification.updateMany.mockResolvedValue({ modifiedCount: 3 });

      await markAllAsRead(mockUserId1);
      expect(RecruitmentNotification.updateMany).toHaveBeenCalledWith(
        { recipientId: mockUserId1, isRead: false },
        { $set: { isRead: true } }
      );
    });

    test('clears all read notifications for user', async () => {
      RecruitmentNotification.deleteMany.mockResolvedValue({ deletedCount: 5 });

      await clearReadNotifications(mockUserId1);
      expect(RecruitmentNotification.deleteMany).toHaveBeenCalledWith({
        recipientId: mockUserId1,
        isRead: true,
      });
    });
  });
});
