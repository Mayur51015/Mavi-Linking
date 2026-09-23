import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import api from '../api/axios';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, socket, loading: authLoading } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  // Helper: Verify that authentication is fully restored with a valid token
  const hasValidSession = useCallback(() => {
    if (!user || authLoading) return false;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token || token === 'undefined' || token === 'null' || !token.trim()) return false;
    // Unverified students are forbidden by protect middleware from accessing notification endpoints
    if (user.role === 'user' && user.emailVerified === false) return false;
    return true;
  }, [user, authLoading]);

  // 1. Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!hasValidSession()) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data?.success) {
        setUnreadCount(res.data.data.count ?? 0);
      }
    } catch (err) {
      // If unauthorized or forbidden, reset count safely without looping
      if (err.response?.status === 401 || err.response?.status === 403) {
        setUnreadCount(0);
      }
    }
  }, [hasValidSession]);

  // 2. Fetch notifications list
  const fetchNotifications = useCallback(async ({
    page = 1,
    limit = 20,
    category = 'all',
    search = '',
    unreadOnly = false,
    append = false,
  } = {}) => {
    if (!hasValidSession()) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (category && category !== 'all') params.append('category', category);
      if (search && search.trim()) params.append('search', search.trim());
      if (unreadOnly) params.append('unreadOnly', 'true');

      const res = await api.get(`/notifications?${params.toString()}`);
      if (res.data?.success) {
        const { notifications: list, unreadCount: count, pagination: pageInfo } = res.data.data;
        setNotifications((prev) => (append ? [...prev, ...list] : list));
        setUnreadCount(count ?? 0);
        if (pageInfo) setPagination(pageInfo);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(err.response?.data?.message || err.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [hasValidSession]);

  // 3. Mark single notification as read
  const markAsRead = useCallback(async (id) => {
    if (!id) return;
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.put(`/notifications/${id}/read`);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Rollback or re-fetch on error
      fetchUnreadCount();
    }
  }, [fetchUnreadCount]);

  // 4. Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await api.put('/notifications/read-all');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      fetchUnreadCount();
    }
  }, [fetchUnreadCount]);

  // 5. Delete single notification
  const deleteNotification = useCallback(async (id) => {
    if (!id) return;
    const target = notifications.find((n) => n._id === id);
    const wasUnread = target && !target.isRead;

    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await api.delete(`/notifications/${id}`);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, [notifications]);

  // 6. Clear read notifications
  const clearRead = useCallback(async () => {
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    try {
      await api.delete('/notifications/clear-read');
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
    }
  }, []);

  // Real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket]);

  // Polling unread count every 30s only when fully authenticated with a valid session
  useEffect(() => {
    if (!hasValidSession()) {
      setUnreadCount(0);
      return;
    }
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [hasValidSession, fetchUnreadCount]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      pagination,
      fetchUnreadCount,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearRead,
    }),
    [
      notifications,
      unreadCount,
      loading,
      error,
      pagination,
      fetchUnreadCount,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearRead,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
