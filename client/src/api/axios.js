import axios from 'axios';

// ─── Centralized API Instance ───────────────────────────────────────────────
// All API calls go through this single instance.
// baseURL is set via VITE_API_URL env var. If the provided URL omits /api,
// normalize it to avoid production 404s when the frontend and backend are hosted separately.
const rawApiUrl = import.meta.env.VITE_API_URL;

if (import.meta.env.PROD && !rawApiUrl) {
  console.warn(
    'VITE_API_URL is not configured for production. The frontend will fall back to localhost:5000, which will fail in deployed environments.'
  );
}

const apiBaseUrl = rawApiUrl
  ? (() => {
      const trimmed = rawApiUrl.replace(/\/+$/u, '');
      return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
    })()
  : 'http://localhost:5000/api';

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
    // Auto-logout on 401 (expired/invalid token)
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        // Only redirect if not already on login/register page
        const path = window.location.pathname;
        if (path !== '/login' && path !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
