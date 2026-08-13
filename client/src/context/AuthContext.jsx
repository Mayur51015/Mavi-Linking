import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { getAccessToken, setTokens, clearTokens } from '../api/tokenStorage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        setUser(res.data.data.user);
      } catch (error) {
        // A 401 here has already been through the refresh interceptor, so if we
        // land in this branch the session is genuinely gone.
        console.error('Error fetching user', error);
        clearTokens();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Establish persistent Socket.IO connection when authenticated
  const userId = user?._id || user?.id;
  useEffect(() => {
    const token = getAccessToken();
    if (userId && token) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      console.log('Initializing socket connection to:', socketUrl);
      
      const newSocket = io(socketUrl, {
        auth: (cb) => {
          // Read at connect time so a refreshed token is picked up automatically.
          cb({ token: getAccessToken() });
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
        const freshToken = getAccessToken();
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
    const { token, refreshToken } = res.data.data;
    setTokens({ token, refreshToken });
    setUser(res.data.data.user);
    return res.data.data;
  }, []);

  const register = useCallback(async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { token, refreshToken } = res.data.data;
    setTokens({ token, refreshToken });
    setUser(res.data.data.user);
    return res.data.data;
  }, []);

  const logout = useCallback(async () => {
    // Tell the server to drop the refresh token, otherwise it stays valid
    // indefinitely after the user thinks they've signed out. Best-effort: the
    // local session is cleared either way, so a failed call can't strand a
    // user in a half-logged-in state.
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed; clearing local session anyway', error);
    }

    clearTokens();
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
