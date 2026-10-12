import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import api, { getBackendBaseUrl } from '../api/axios';
import { getDashboardRouteForRole } from '../utils/roleRouting';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getSupabaseAuthErrorMessage } from '../utils/supabaseErrors';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [supabaseSession, setSupabaseSession] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsAccountLinking, setNeedsAccountLinking] = useState(false);

  /**
   * Fetch MongoDB user profile corresponding to the active token
   */
  const loadUserProfile = useCallback(async (tokenToUse) => {
    try {
      const headers = tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {};
      const res = await api.get('/auth/me', { headers });
      setUser(res.data?.data?.user || null);
      setNeedsAccountLinking(false);
      return res.data?.data?.user;
    } catch (error) {
      if (error.response?.data?.code === 'ACCOUNT_LINKING_REQUIRED') {
        setNeedsAccountLinking(true);
        return null;
      }

      // Check if this was a new Supabase user with pending registration data
      if (localStorage.getItem('authProvider') === 'supabase') {
        const pendingRegRaw = sessionStorage.getItem('edutalentx_pending_registration');
        if (pendingRegRaw) {
          try {
            const pendingReg = JSON.parse(pendingRegRaw);
            const syncRes = await api.post('/auth/supabase/sync-profile', pendingReg, {
              headers: tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {},
            });
            if (syncRes.data?.data?.user) {
              sessionStorage.removeItem('edutalentx_pending_registration');
              setUser(syncRes.data.data.user);
              return syncRes.data.data.user;
            }
          } catch (syncErr) {
            console.warn('[Supabase Profile Sync Error]:', syncErr.message);
          }
        }
      }

      // Discard invalid/expired tokens (401 Unauthorized)
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('authProvider');
        setUser(null);
      }
      return null;
    }
  }, []);

  // ─── 1. Initialize Authentication (Supabase Session + Fallback) ──────
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      // 1. If Supabase is configured, check for active Supabase session
      if (isSupabaseConfigured()) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (session && !error) {
            if (isMounted) {
              setSupabaseSession(session);
              localStorage.setItem('token', session.access_token);
              localStorage.setItem('authProvider', 'supabase');
            }
            await loadUserProfile(session.access_token);
            if (isMounted) setLoading(false);
            return;
          }
        } catch (supabaseErr) {
          console.warn('[Supabase Auth] Session fetch error:', supabaseErr.message);
        }
      }

      // 2. Check for legacy token in localStorage if no Supabase session
      const legacyToken = localStorage.getItem('token');
      if (legacyToken) {
        await loadUserProfile(legacyToken);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    initializeAuth();

    // ─── 2. Subscribe to Supabase Auth State Events ────────────────────
    let authListener = null;
    if (isSupabaseConfigured()) {
      const { data } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (currentSession?.access_token) {
            setSupabaseSession(currentSession);
            localStorage.setItem('token', currentSession.access_token);
            localStorage.setItem('authProvider', 'supabase');
            await loadUserProfile(currentSession.access_token);
          }
        } else if (event === 'SIGNED_OUT') {
          if (localStorage.getItem('authProvider') === 'supabase') {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('authProvider');
            setUser(null);
            setSupabaseSession(null);
          }
        }
      });
      authListener = data.subscription;
    }

    return () => {
      isMounted = false;
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, [loadUserProfile]);

  // ─── 3. Socket.IO Real-Time Feed Connection ──────────────────────────
  const userId = user?._id || user?.id;
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (userId && token) {
      const isBrowser = typeof window !== 'undefined';
      const isLocalHostname = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const configuredSocket = import.meta.env.VITE_SOCKET_URL;

      let socketUrl;
      if (isBrowser && !isLocalHostname) {
        if (configuredSocket && !configuredSocket.includes('localhost') && !configuredSocket.includes('127.0.0.1')) {
          socketUrl = configuredSocket.replace(/\/+$/u, '');
        } else {
          socketUrl = getBackendBaseUrl();
        }
      } else {
        socketUrl = configuredSocket || getBackendBaseUrl();
      }

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
        newSocket.emit('joinRoom', userId);
      });

      newSocket.on('account_status_updated', (data) => {
        if (data?.accountStatus) {
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  accountStatus: data.accountStatus,
                  emailVerified: true,
                  prnVerificationStatus: 'approved',
                }
              : prev
          );
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      setSocket(null);
    }
  }, [userId]);

  // ─── 4. Supabase Sign Up ─────────────────────────────────────────────
  const signUpWithSupabase = useCallback(async ({ email, password, name, registrationData }) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase authentication is not configured.');
    }

    const cleanEmail = email.toLowerCase().trim();

    // Store pending registration data for institutional onboarding
    if (registrationData) {
      sessionStorage.setItem('edutalentx_pending_registration', JSON.stringify({
        ...registrationData,
        name: name || registrationData.name,
      }));
    }
    localStorage.setItem('pendingVerificationEmail', cleanEmail);

    const redirectUrl = `${window.location.origin}/verify-account`;

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: name || '',
          full_name: name || '',
        },
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      throw new Error(getSupabaseAuthErrorMessage(error));
    }

    // If email confirmation is disabled in Supabase, session is active immediately
    if (data.session) {
      setSupabaseSession(data.session);
      localStorage.setItem('token', data.session.access_token);
      localStorage.setItem('authProvider', 'supabase');

      // Synchronize MongoDB student profile
      if (registrationData) {
        const syncRes = await api.post('/auth/supabase/sync-profile', registrationData);
        setUser(syncRes.data?.data?.user);
        return { user: syncRes.data?.data?.user, session: data.session, emailConfirmationRequired: false };
      }
    }

    return {
      user: data.user,
      session: data.session,
      emailConfirmationRequired: !data.session,
    };
  }, []);

  // ─── 5. Supabase Sign In with Password ───────────────────────────────
  const signInWithSupabase = useCallback(async ({ email, password }) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase authentication is not configured.');
    }

    const cleanEmail = email.toLowerCase().trim();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      throw new Error(getSupabaseAuthErrorMessage(error));
    }

    setSupabaseSession(data.session);
    localStorage.setItem('token', data.session.access_token);
    localStorage.setItem('authProvider', 'supabase');

    // Fetch or provision user profile from backend
    const profile = await loadUserProfile(data.session.access_token);
    return { user: profile, session: data.session };
  }, [loadUserProfile]);

  // ─── 6. Supabase Password Recovery ───────────────────────────────────
  const resetPasswordForEmail = useCallback(async (email) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase authentication is not configured.');
    }

    const cleanEmail = email.toLowerCase().trim();
    const redirectUrl = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl,
    });

    if (error) {
      throw new Error(getSupabaseAuthErrorMessage(error));
    }

    return { success: true };
  }, []);

  // ─── 7. Supabase Password Update ─────────────────────────────────────
  const updateUserPassword = useCallback(async (newPassword) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase authentication is not configured.');
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(getSupabaseAuthErrorMessage(error));
    }

    return data;
  }, []);

  // ─── 8. Link Existing Account to Supabase ────────────────────────────
  const linkAccountWithSupabase = useCallback(async (password) => {
    const res = await api.post('/auth/supabase/link-account', { password });
    if (res.data?.data?.user) {
      setUser(res.data.data.user);
      setNeedsAccountLinking(false);
    }
    return res.data;
  }, []);

  // ─── 9. Unified Login (Seamless Supabase + Legacy Fallback) ─────────
  const login = useCallback(async (identifier, password) => {
    const cleanId = (identifier || '').trim();

    // If identifier is an email and Supabase is configured, try Supabase Auth first
    if (cleanId.includes('@') && isSupabaseConfigured()) {
      try {
        const { user: supabaseUser, session } = await signInWithSupabase({ email: cleanId, password });
        if (supabaseUser) {
          return { user: supabaseUser, token: session.access_token };
        }
      } catch (err) {
        // If unconfirmed email, propagate immediately
        if (err.message.includes('not yet confirmed') || err.message.includes('confirm')) {
          throw err;
        }
        // If rate limit exceeded, propagate immediately
        if (err.message.includes('rate limit')) {
          throw err;
        }
        // Otherwise, fall through to legacy check (in case user hasn't migrated to Supabase yet)
      }
    }

    // Standard / Legacy Backend Authentication (ETX ID, PRN, Admin ID, or legacy password)
    const res = await api.post('/auth/login', { identifier: cleanId, password });
    localStorage.setItem('token', res.data.data.token);
    localStorage.setItem('authProvider', 'local');
    setUser(res.data.data.user);
    return res.data.data;
  }, [signInWithSupabase]);

  // ─── 10. Unified Register ────────────────────────────────────────────
  const register = useCallback(async (userData) => {
    if (isSupabaseConfigured()) {
      try {
        return await signUpWithSupabase({
          email: userData.email,
          password: userData.password,
          name: userData.name,
          registrationData: userData,
        });
      } catch (supaErr) {
        console.warn('[Supabase Sign Up hit limitation or failed, falling back to server registration]:', supaErr.message);
        // Fall back to primary server registration if Supabase fails (e.g. 429 over_email_send_rate_limit)
      }
    }

    // Fallback to legacy/primary registration on server
    const res = await api.post('/auth/register', userData);
    const token = res.data?.data?.token;
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('authProvider', 'local');
      setUser(res.data?.data?.user);
    }
    return {
      ...res.data,
      user: res.data?.data?.user,
    };
  }, [signUpWithSupabase]);

  // ─── 11. Sign Out / Logout ───────────────────────────────────────────
  const logout = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore signout error if session was already terminated
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authProvider');
    sessionStorage.removeItem('edutalentx_pending_registration');
    setUser(null);
    setSupabaseSession(null);
    setNeedsAccountLinking(false);
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword, confirmPassword) => {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword });
    setUser(res.data.data.user);
    return res.data.data;
  }, []);

  const requestRoleUpgrade = useCallback(async (requestedRole, verificationDetails) => {
    const res = await api.post('/auth/request-role-upgrade', { requestedRole, verificationDetails });
    setUser(res.data.data.user);
    return res.data.data;
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await loadUserProfile(token);
    }
  }, [loadUserProfile]);

  const updateProfile = useCallback(async (profileData) => {
    const res = await api.put('/auth/me', profileData);
    if (res.data?.data?.user) {
      setUser(res.data.data.user);
    }
    return res.data;
  }, []);

  const getDashboardPath = useCallback(() => {
    if (!user) return '/login';
    return getDashboardRouteForRole(user);
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
    needsAccountLinking,
    supabaseSession,
    login,
    register,
    signUpWithSupabase,
    signInWithSupabase,
    resetPasswordForEmail,
    updateUserPassword,
    linkAccountWithSupabase,
    changePassword,
    requestRoleUpgrade,
    updateProfile,
    logout,
    refreshUser,
    getDashboardPath,
    setUser,
    socket,
    isSupabaseConfigured: isSupabaseConfigured(),
  }), [
    user,
    loading,
    isPendingVerification,
    needsAccountLinking,
    supabaseSession,
    socket,
    login,
    register,
    signUpWithSupabase,
    signInWithSupabase,
    resetPasswordForEmail,
    updateUserPassword,
    linkAccountWithSupabase,
    changePassword,
    requestRoleUpgrade,
    updateProfile,
    logout,
    refreshUser,
    getDashboardPath,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
