import axios from 'axios';
import { notify } from '../context/ToastContext';
// ─── Centralized API Instance ───────────────────────────────────────────────
// All API calls go through this single instance.
// baseURL is set via VITE_API_URL env var. If the provided URL omits /api,
// normalize it to avoid production 404s when the frontend and backend are hosted separately.
const rawApiUrl = import.meta.env.VITE_API_URL;
const isBrowser = typeof window !== 'undefined';
const isLocalHostname = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const isProd = import.meta.env.PROD || (isBrowser && !isLocalHostname);

const DEFAULT_PROD_API = 'https://mavi-server-4yvl.onrender.com/api';
const DEFAULT_DEV_API = 'http://localhost:5000/api';

export const getApiBaseUrl = () => {
  if (isBrowser && !isLocalHostname) {
    // In production or deployed preview environments, never attempt to connect to localhost
    if (rawApiUrl && !rawApiUrl.includes('localhost') && !rawApiUrl.includes('127.0.0.1')) {
      const trimmed = rawApiUrl.replace(/\/+$/u, '');
      return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
    }
    return DEFAULT_PROD_API;
  }

  if (rawApiUrl) {
    const trimmed = rawApiUrl.replace(/\/+$/u, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }

  return isProd ? DEFAULT_PROD_API : DEFAULT_DEV_API;
};

export const getBackendBaseUrl = () => {
  return getApiBaseUrl().replace(/\/api\/?$/u, '');
};

const apiBaseUrl = getApiBaseUrl();

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ─── Request Interceptor — Attach JWT ───────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const isPublicAuthEndpoint = config.url && (
      config.url.endsWith('/auth/login') ||
      config.url.endsWith('/auth/register') ||
      config.url.endsWith('/auth/forgot-password') ||
      config.url.endsWith('/auth/reset-password')
    );
    const token = localStorage.getItem('token');
    if (token && !isPublicAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — Handle Auth Errors ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Connection / Network Error (backend server not running or unreachable)
    if (!error.response) {
      const isConnectionRefused = error.message?.includes('Network Error') || error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED';
      console.error(`[API Connection Error] ${isConnectionRefused ? 'Backend unreachable (ERR_CONNECTION_REFUSED / Network Error)' : error.message} at ${error.config?.url}`);
      error.isNetworkError = true;
      return Promise.reject(error);
    }

    const status = error.response.status;
    const errData = error.response.data;
    const errMsg = errData?.message || (Array.isArray(errData?.errors) ? errData.errors.map((e) => e.message || e.msg).join(', ') : `HTTP ${status}`);

    // 2. Specific HTTP status logging & handling
    if (status === 400) {
      console.warn(`[API 400 Bad Request] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, errMsg);
    } else if (status === 401 || (status >= 500 && (errMsg?.toLowerCase().includes('authentication error') || errMsg?.toLowerCase().includes('jwt')))) {
      const isLoginAttempt = error.config?.url && (
        error.config.url.includes('/auth/login') ||
        error.config.url.includes('/auth/admin-login') ||
        error.config.url.includes('/auth/super-admin-login')
      );
      if (isLoginAttempt) {
        console.warn(`[API ${status} Unauthorized] Login credentials rejected:`, errMsg);
      } else {
        console.warn(`[API ${status} Unauthorized] Expired or invalid session on:`, error.config?.url);
        const hadToken = !!localStorage.getItem('token');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        const authPages = [
          '/login',
          '/owner/login',
          '/super-admin/login',
          '/admin/login',
          '/register',
          '/verify-account',
          '/verify-email',
          '/pending-approval',
          '/activate-account',
        ];
        const isAuthPage = authPages.some((p) => path === p || path.startsWith('/public/'));

        if (hadToken && !isAuthPage && typeof window !== 'undefined') {
          notify('warning', 'Your session has expired. Please log in again.');
          if (path.startsWith('/owner')) {
            window.location.href = '/owner/login';
          } else if (path.startsWith('/super-admin')) {
            window.location.href = '/super-admin/login';
          } else if (path.startsWith('/admin')) {
            window.location.href = '/admin/login';
          } else {
            window.location.href = '/login';
          }
        }
      }
    } else if (status === 403) {
      console.warn(`[API 403 Forbidden] Access denied on ${error.config?.url}:`, errMsg);
    } else if (status === 404) {
      console.warn(`[API 404 Not Found] ${error.config?.url}:`, errMsg);
    } else if (status === 422) {
      console.warn(`[API 422 Unprocessable Entity] ${error.config?.url}:`, errMsg);
    } else if (status >= 500) {
      console.error(`[API ${status} Server Error] ${error.config?.url}:`, errMsg);
    }

    return Promise.reject(error);
  }
);
export default api;
