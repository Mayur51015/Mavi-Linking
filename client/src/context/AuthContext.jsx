import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import api, { socketOriginFromApiBaseUrl } from '../api/axios';

export const AuthContext = createContext();

// Enough retries to ride out a server restart or a brief network drop, few
// enough that a genuine misconfiguration stops instead of running forever.
const MAX_SOCKET_RECONNECT_ATTEMPTS = 10;

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
      // Derived from the API base URL rather than hardcoded a second time. The
      // socket and the API are the same server, so having two independent
      // copies of the production host only creates a way for them to disagree.
      const socketUrl = import.meta.env.VITE_SOCKET_URL || socketOriginFromApiBaseUrl();

      const newSocket = io(socketUrl, {
        auth: (cb) => {
          cb({ token: localStorage.getItem('token') });
        },
        withCredentials: true,
        transports: ['polling', 'websocket'],
        reconnection: true,
        // Was Infinity. A CORS rejection or a wrong socket URL is not something
        // retrying fixes, so that turned a misconfiguration into one handshake
        // per second, per open tab, forever — against an endpoint outside the
        // /api prefix that the rate limiter doesn't cover.
        reconnectionAttempts: MAX_SOCKET_RECONNECT_ATTEMPTS,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 15000,
        randomizationFactor: 0.5,
        timeout: 20000,
      });

      newSocket.on('connect', () => {
        newSocket.emit('joinRoom', userId);
      });

      newSocket.on('disconnect', (reason) => {
        // 'io server disconnect' means the server dropped us deliberately, so
        // socket.io won't retry on its own. Every other reason it handles.
        if (reason === 'io server disconnect') {
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (error) => {
        // Only an auth failure is worth re-attempting with a fresh token.
        // Treating every failure that way — as the old handler did — meant a
        // CORS rejection was retried as if the token were stale, immediately
        // and without a backoff, which is what produced the loop.
        if (/auth/iu.test(error.message || '')) {
          const freshToken = localStorage.getItem('token');
          if (freshToken) {
            newSocket.auth = { token: freshToken };
          }
          return;
        }

        console.error(
          `Real-time connection to ${socketUrl} failed: ${error.message}. ` +
            'If this persists, check that the origin is in the server CORS allowlist ' +
            '(CLIENT_URL) and that VITE_SOCKET_URL points at the API host.'
        );
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      setSocket(null);
    }

    return undefined;
  }, [userId]);

  const login = useCallback(async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    localStorage.setItem('token', res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data;
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword, confirmPassword) => {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword });
    setUser(res.data.data.user);
    return res.data.data;
  }, []);

  const register = useCallback(async (userData) => {
    const res = await api.post('/auth/register', userData);
    localStorage.setItem('token', res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data;
  }, []);

  const requestRoleUpgrade = useCallback(async (requestedRole, verificationDetails) => {
    const res = await api.post('/auth/request-role-upgrade', { requestedRole, verificationDetails });
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
    changePassword,
    register,
    requestRoleUpgrade,
    logout,
    refreshUser,
    getDashboardPath,
    setUser,
    socket,
  }), [user, loading, socket, login, changePassword, register, requestRoleUpgrade, logout, refreshUser, getDashboardPath]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
