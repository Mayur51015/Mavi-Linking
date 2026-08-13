import axios from 'axios';
import { notify } from '../context/ToastContext';
// ─── Centralized API Instance ───────────────────────────────────────────────
// All API calls go through this single instance.
// baseURL is set via VITE_API_URL env var. If the provided URL omits /api,
// normalize it to avoid production 404s when the frontend and backend are hosted separately.
const rawApiUrl = import.meta.env.VITE_API_URL;
const isProd = import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');

const DEFAULT_PROD_API = 'https://mavi-server-4yvl.onrender.com/api';
const DEFAULT_DEV_API = 'http://localhost:5000/api';

const apiBaseUrl = rawApiUrl
  ? (() => {
      const trimmed = rawApiUrl.replace(/\/+$/u, '');
      return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
    })()
  : (isProd ? DEFAULT_PROD_API : DEFAULT_DEV_API);

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

    // Auto-logout on 401 (expired/invalid token)
    if (error.response.status === 401) {
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        // Only redirect if not already on login/register page
        const path = window.location.pathname;
        if (path !== '/login' && path !== '/register') {
          notify('warning', 'Your session has expired. Please log in again.');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
export default api;
