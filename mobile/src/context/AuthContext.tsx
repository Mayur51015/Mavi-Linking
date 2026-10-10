/**
 * Mobile Authentication Context
 * ─────────────────────────────
 * Complete session lifecycle, SecureStore persistence,
 * canonical role resolution, and login/register/logout workflows.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, CanonicalRole } from '../types/models';
import { Storage } from '../api/storage';
import { api, updateApiBaseUrl, setOnUnauthorizedListener, initApiClient } from '../api/client';
import { EnvironmentType, ENVIRONMENTS } from '../config/environment';

export const getUserPrimaryRole = (user: User | null | undefined): CanonicalRole => {
  if (!user) return 'student';

  const userRoles = Array.isArray(user.roles) && user.roles.length > 0
    ? user.roles
    : [user.role];

  const primaryRoleStr = String(user.role || '').toLowerCase().trim();
  const allRoles = userRoles.map((r) => String(r || '').toLowerCase().trim());

  // 1. Platform Owner (Highest Authority)
  if (
    allRoles.includes('platform_owner') ||
    allRoles.includes('owner') ||
    primaryRoleStr === 'platform_owner' ||
    primaryRoleStr === 'owner' ||
    user.adminId === 'ETX-OWNER-001' ||
    String(user.adminId || '').toUpperCase().startsWith('MAVI-OWNER') ||
    String(user.email || '').toLowerCase() === 'mayur1718khandare@gmail.com' ||
    String(user.email || '').toLowerCase() === 'owner@edutalentx.com'
  ) {
    return 'owner';
  }

  // 2. Platform Super Admin
  if (
    allRoles.includes('super_admin') ||
    primaryRoleStr === 'super_admin'
  ) {
    return 'super_admin';
  }

  // 3. Department Admin / HOD
  if (
    allRoles.includes('department_admin') ||
    primaryRoleStr === 'department_admin' ||
    allRoles.includes('hod') ||
    primaryRoleStr === 'hod'
  ) {
    return 'department_admin';
  }

  // 4. Institution Administrator
  if (
    allRoles.includes('institution_admin') ||
    allRoles.includes('admin') ||
    primaryRoleStr === 'institution_admin' ||
    primaryRoleStr === 'admin'
  ) {
    return 'institution_admin';
  }

  // 5. Faculty / Teacher
  if (
    allRoles.includes('teacher') ||
    allRoles.includes('faculty') ||
    allRoles.includes('professor') ||
    primaryRoleStr === 'teacher' ||
    primaryRoleStr === 'faculty' ||
    primaryRoleStr === 'professor'
  ) {
    return 'teacher';
  }

  // 6. Recruiter
  if (
    allRoles.includes('recruiter') ||
    primaryRoleStr === 'recruiter'
  ) {
    return 'recruiter';
  }

  // 7. Student / User (Default)
  return 'student';
};

interface AuthContextValue {
  user: User | null;
  role: CanonicalRole;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentEnv: EnvironmentType;
  environmentLabel: string;
  login: (identifier: string, pass: string) => Promise<User>;
  register: (payload: { name: string; email: string; password: string; role?: string; prn?: string }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  switchEnvironment: (type: EnvironmentType, customUrl?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentEnv, setCurrentEnv] = useState<EnvironmentType>('production');

  // Compute canonical verified role from authenticated user
  const role: CanonicalRole = useMemo(() => getUserPrimaryRole(user), [user]);
  const isAuthenticated = Boolean(user && token);

  const environmentLabel = useMemo(() => {
    return ENVIRONMENTS[currentEnv]?.label || currentEnv;
  }, [currentEnv]);

  // Session restoration on startup
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        await initApiClient();
        const storedEnv = await Storage.getEnvironment();
        if (isMounted) setCurrentEnv(storedEnv.type);

        const savedToken = await Storage.getToken();
        if (!savedToken) {
          if (isMounted) setIsLoading(false);
          return;
        }

        if (isMounted) setToken(savedToken);

        // Fetch fresh profile from backend
        const res = await api.get('/auth/me');
        if (res.data?.success && res.data.data?.user) {
          const freshUser: User = res.data.data.user;
          if (isMounted) {
            setUser(freshUser);
            await Storage.setUser(freshUser);
          }
        } else {
          // Token rejected or invalid format
          await Storage.clearAuth();
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Session restore encountered error:', err);
        // Fallback to cached user profile offline
        const cachedUser = await Storage.getUser();
        if (cachedUser && isMounted) {
          setUser(cachedUser);
        } else {
          await Storage.clearAuth();
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    restoreSession();

    // Register 401 unauth handler
    setOnUnauthorizedListener(() => {
      setUser(null);
      setToken(null);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Login handler
  const login = useCallback(async (identifier: string, pass: string): Promise<User> => {
    setIsLoading(true);
    try {
      const trimmedId = identifier.trim();
      const res = await api.post('/auth/login', {
        identifier: trimmedId,
        password: pass,
      });

      if (!res.data?.success || !res.data.data?.token) {
        throw new Error(res.data?.message || 'Login failed.');
      }

      const receivedToken: string = res.data.data.token;
      const loggedInUser: User = res.data.data.user;

      await Storage.setToken(receivedToken);
      await Storage.setUser(loggedInUser);

      setToken(receivedToken);
      setUser(loggedInUser);

      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Registration handler
  const register = useCallback(async (payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
    prn?: string;
  }): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', payload);
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Registration failed.');
      }

      const receivedToken: string = res.data.data?.token;
      const registeredUser: User = res.data.data?.user;

      if (receivedToken) {
        await Storage.setToken(receivedToken);
        await Storage.setUser(registeredUser);
        setToken(receivedToken);
        setUser(registeredUser);
      }

      return registeredUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      if (token) {
        await api.post('/auth/logout').catch(() => {});
      }
    } finally {
      await Storage.clearAuth();
      setUser(null);
      setToken(null);
    }
  }, [token]);

  // Refresh profile
  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data.data?.user) {
        const updated: User = res.data.data.user;
        setUser(updated);
        await Storage.setUser(updated);
        return updated;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data: Partial<User>): Promise<User> => {
    const res = await api.put('/auth/me', data);
    if (!res.data?.success || !res.data.data?.user) {
      throw new Error(res.data?.message || 'Failed to update profile.');
    }
    const updated: User = res.data.data.user;
    setUser(updated);
    await Storage.setUser(updated);
    return updated;
  }, []);

  // Environment Switcher
  const switchEnvironment = useCallback(async (type: EnvironmentType, customUrl?: string) => {
    await Storage.setEnvironment(type, customUrl);
    setCurrentEnv(type);

    if (type === 'custom' && customUrl) {
      updateApiBaseUrl(customUrl);
    } else if (ENVIRONMENTS[type]) {
      updateApiBaseUrl(ENVIRONMENTS[type].apiUrl);
    }

    // Attempt refresh on new environment
    if (token) {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.success && res.data.data?.user) {
          setUser(res.data.data.user);
        }
      } catch {
        // If credentials are invalid on switched server, clear
        await Storage.clearAuth();
        setUser(null);
        setToken(null);
      }
    }
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      role,
      token,
      isAuthenticated,
      isLoading,
      currentEnv,
      environmentLabel,
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
      switchEnvironment,
    }),
    [
      user,
      role,
      token,
      isAuthenticated,
      isLoading,
      currentEnv,
      environmentLabel,
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
      switchEnvironment,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
