import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import api, { getBackendBaseUrl } from '../api/axios';

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
      const isBrowser = typeof window !== 'undefined';
      const isLocalHostname = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const configuredSocket = import.meta.env.VITE_SOCKET_URL;

      let socketUrl;
      if (isBrowser && !isLocalHostname) {
        // In production/deployed environments, never use localhost
        if (configuredSocket && !configuredSocket.includes('localhost') && !configuredSocket.includes('127.0.0.1')) {
          socketUrl = configuredSocket.replace(/\/+$/u, '');
        } else {
          socketUrl = getBackendBaseUrl();
        }
      } else {
        socketUrl = configuredSocket || getBackendBaseUrl();
      }

      console.log('Initializing socket connection to:', socketUrl);
      
      const newSocket = io(socketUrl, {
        auth: (cb) => {
          cb({ token: localStorage.getItem('token') });
        },
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
      });

      newSocket.on('connect', () => {
        console.log('User connected to real-time feed:', newSocket.id);
        newSocket.emit('joinRoom', userId);
      });

      newSocket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${newSocket.id}, reason: ${reason}`);
        if (reason === 'io server disconnect') {
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (error) => {
        console.warn('Socket connection error:', error.message);
        if (
          error.message &&
          (error.message.includes('Authentication error') ||
            error.message.includes('token') ||
            error.message.includes('jwt') ||
            error.message.includes('Unauthorized'))
        ) {
          // Token is invalid/expired — stop hammering the server
          newSocket.disconnect();
        }
      });

      newSocket.on('account_status_updated', (data) => {
        console.log('Account status updated event received:', data);
        if (data?.accountStatus) {
          setUser((prev) => prev ? { ...prev, accountStatus: data.accountStatus, emailVerified: true, prnVerificationStatus: 'approved' } : prev);
        }
      });

      // BFCache (Back-Forward Cache) handling
      const handlePageHide = () => {
        if (newSocket && newSocket.connected) {
          newSocket.disconnect();
        }
      };

      const handlePageShow = (event) => {
        if (event.persisted && newSocket && !newSocket.connected) {
          const currentToken = localStorage.getItem('token');
          if (currentToken) {
            newSocket.connect();
          }
        }
      };

      if (isBrowser) {
        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('pageshow', handlePageShow);
      }

      setSocket(newSocket);

      return () => {
        if (isBrowser) {
          window.removeEventListener('pagehide', handlePageHide);
          window.removeEventListener('pageshow', handlePageShow);
        }
        console.log('Cleaning up socket connection:', newSocket.id);
        newSocket.disconnect();
      };
    } else {
      setSocket(null);
    }
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
    const token = res.data?.data?.token;
    if (token) {
      localStorage.setItem('token', token);
      setUser(res.data?.data?.user);
    }
    return {
      ...res.data,
      user: res.data?.data?.user,
    };
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

  const updateProfile = useCallback(async (profileData) => {
    const res = await api.put('/auth/me', profileData);
    if (res.data?.data?.user) {
      setUser(res.data.data.user);
    }
    return res.data;
  }, []);

  /**
   * Get the dashboard path based on user role
   */
  const getDashboardPath = useCallback(() => {
    if (!user) return '/login';
    switch (user.role) {
      case 'department_admin': return '/department-admin';
      case 'institution_admin':
      case 'admin': return '/admin';
      case 'super_admin': return '/super-admin';
      case 'owner':
      case 'platform_owner': return '/owner';
      case 'recruiter': return '/dashboard/recruiter';
      case 'teacher':
      case 'professor': return '/dashboard/teacher';
      default: return '/dashboard';
    }
  }, [user]);

  const isPendingVerification = useMemo(() => {
    return Boolean(
      user &&
      (user.role === 'user' || (Array.isArray(user.roles) && user.roles.includes('user'))) &&
      (user.accountStatus === 'PENDING_ADMIN_APPROVAL' || user.accountStatus === 'PENDING_VERIFICATION')
    );
  }, [user]);

  const contextValue = useMemo(() => ({
    user,
    loading,
    isPendingVerification,
    login,
    changePassword,
    register,
    requestRoleUpgrade,
    updateProfile,
    logout,
    refreshUser,
    getDashboardPath,
    setUser,
    socket,
  }), [user, loading, isPendingVerification, socket, login, changePassword, register, requestRoleUpgrade, updateProfile, logout, refreshUser, getDashboardPath]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
