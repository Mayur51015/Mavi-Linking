/**
 * Mobile Notification Context
 * ────────────────────────────
 * Manages notification inbox state, unread counter badge,
 * and real-time Socket.IO event synchronization.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api/client';
import { AppNotification, NotificationCategory } from '../types/models';
import { connectSocket, disconnectSocket } from '../services/socket';

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (params?: { category?: NotificationCategory; unreadOnly?: boolean }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, isAuthenticated, currentEnv } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data?.success) {
        setUnreadCount(res.data.data?.count ?? 0);
      }
    } catch {
      // Graceful fallback
    }
  }, [isAuthenticated, token]);

  // 2. Fetch notifications list
  const fetchNotifications = useCallback(
    async (params?: { category?: NotificationCategory; unreadOnly?: boolean }) => {
      if (!isAuthenticated || !token) return;
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (params?.category && params.category !== 'all') {
          queryParams.append('category', params.category);
        }
        if (params?.unreadOnly) {
          queryParams.append('unreadOnly', 'true');
        }
        queryParams.append('limit', '30');

        const res = await api.get(`/notifications?${queryParams.toString()}`);
        if (res.data?.success) {
          const list: AppNotification[] = res.data.data?.notifications || [];
          setNotifications(list);
          setUnreadCount(res.data.data?.unreadCount ?? 0);
        }
      } catch (err: any) {
        setError(err.message || 'Unable to load notifications.');
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, token]
  );

  // 3. Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    if (!id) return;
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.put(`/notifications/${id}/read`);
    } catch {
      fetchUnreadCount();
    }
  }, [fetchUnreadCount]);

  // 4. Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await api.put('/notifications/read-all');
    } catch {
      fetchUnreadCount();
    }
  }, [fetchUnreadCount]);

  // 5. Delete single notification
  const deleteNotification = useCallback(async (id: string) => {
    if (!id) return;
    const target = notifications.find((n) => n._id === id);
    const wasUnread = target && !target.isRead;

    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      // Rollback on failure
    }
  }, [notifications]);

  // Real-time Socket.IO lifecycle
  useEffect(() => {
    const userId = user?._id || user?.id;
    if (isAuthenticated && token && userId) {
      const socket = connectSocket(token, userId, currentEnv);

      const handleNotification = (notif: AppNotification) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      };

      socket.on('notification', handleNotification);

      return () => {
        socket.off('notification', handleNotification);
        disconnectSocket();
      };
    } else {
      disconnectSocket();
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, token, user?._id, user?.id, currentEnv]);

  // Polling unread count every 45 seconds as backup
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 45000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      error,
      fetchNotifications,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      error,
      fetchNotifications,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
};
