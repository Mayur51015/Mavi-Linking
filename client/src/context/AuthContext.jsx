import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        setUser(res.data.data.user);
      } catch (error) {
        console.error('Error fetching user', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Establish persistent Socket.IO connection when authenticated
  const userId = user?._id || user?.id;
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (userId && token) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      console.log('Initializing socket connection to:', socketUrl);
      
      const newSocket = io(socketUrl, {
        auth: (cb) => {
          cb({ token: localStorage.getItem('token') });
        },
        withCredentials: true,
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      newSocket.on('connect', () => {
        console.log('User connected to real-time feed:', newSocket.id);
        newSocket.emit('joinRoom', userId);
      });

      newSocket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${newSocket.id}, reason: ${reason}`);
        if (reason === 'io server disconnect') {
          // Reconnect manually if server dropped connection
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        // Retry connection with refreshed token if available
        const freshToken = localStorage.getItem('token');
        if (freshToken) {
          newSocket.auth = { token: freshToken };
          newSocket.connect();
        }
      });

      setSocket(newSocket);

      return () => {
        console.log('Cleaning up socket connection:', newSocket.id);
        newSocket.disconnect();
      };
    } else {
      setSocket(null);
    }
  }, [userId]);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data;
  }, []);

  const register = useCallback(async (userData) => {
    const res = await api.post('/auth/register', userData);
    localStorage.setItem('token', res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data.user);
    } catch (error) {
      console.error('Error refreshing user', error);
    }
  }, []);

  /**
   * Get the dashboard path based on user role
   */
  const getDashboardPath = useCallback(() => {
    if (!user) return '/login';
    switch (user.role) {
      case 'recruiter': return '/dashboard/recruiter';
      case 'teacher':
      case 'professor': return '/dashboard/teacher';
      default: return '/dashboard';
    }
  }, [user]);

  const contextValue = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    getDashboardPath,
    setUser,
    socket,
  }), [user, loading, socket, login, register, logout, refreshUser, getDashboardPath]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
