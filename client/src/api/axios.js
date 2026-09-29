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
    const token = localStorage.getItem('token');
    if (token) {
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
    if (!error.response) {
      console.error('API Network/Connection Error:', error.message);
      return Promise.reject(error);
    }

    // Detailed logging on 400 Bad Request
    if (error.response.status === 400) {
      const errData = error.response.data;
      const errMsg = errData?.message || (Array.isArray(errData?.errors) ? errData.errors.map((e) => e.message || e.msg).join(', ') : 'Bad Request');
      console.warn(`[API 400 Bad Request] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, errMsg, errData);
    }

    // Auto-logout on 401 (expired/invalid token)
    if (error.response.status === 401) {
      const hadToken = !!localStorage.getItem('token');
      localStorage.removeItem('token');
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      const authPages = ['/login', '/register', '/verify-account', '/verify-email', '/pending-approval', '/activate-account', '/admin/login'];
      const isAuthPage = authPages.some((p) => path === p || path.startsWith('/public/'));

      if (hadToken && !isAuthPage && typeof window !== 'undefined') {
        notify('warning', 'Your session has expired. Please log in again.');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
export default api;
