import axios from 'axios';
import { notify } from '../context/ToastContext';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokenStorage';
import { createSessionRefresher, isAuthEndpoint } from './sessionRefresh';
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
  : 'http://127.0.0.1:5000/api';

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
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Token Refresh ──────────────────────────────────────────────────────────
// Deliberately uses a bare axios call rather than `api`, so the refresh request
// can't be intercepted by this same handler and recurse.
const refreshAccessToken = createSessionRefresher(async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const { data } = await axios.post(
    `${apiBaseUrl}/auth/refresh`,
    { token: refreshToken },
    { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
  );

  const nextAccessToken = data?.data?.token;
  const nextRefreshToken = data?.data?.refreshToken;

  if (!nextAccessToken) {
    throw new Error('Refresh response did not contain an access token');
  }

  // The server rotates the refresh token on every call, so store both.
  setTokens({ token: nextAccessToken, refreshToken: nextRefreshToken });
  return nextAccessToken;
});

/** Clear the session and send the user to the login page. */
const endSession = (message) => {
  const hadToken = Boolean(getAccessToken() || getRefreshToken());
  clearTokens();

  if (!hadToken) return;

  const path = window.location.pathname;
  if (path !== '/login' && path !== '/register') {
    notify('warning', message);
    window.location.href = '/login';
  }
};

// ─── Response Interceptor — Handle Auth Errors ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // No response at all means the request never reached the server —
    // give visible feedback instead of a silent console-only failure.
    if (!error.response) {
      notify('error', 'Network error. Please check your connection and try again.');
      return Promise.reject(error);
    }

    const originalRequest = error.config || {};

    if (error.response.status !== 401) {
      return Promise.reject(error);
    }

    // A 401 from login/register/refresh is the real answer — bad credentials or
    // a dead refresh token — not an expired access token to renew.
    if (isAuthEndpoint(originalRequest.url) || originalRequest._retry) {
      endSession('Your session has expired. Please log in again.');
      return Promise.reject(error);
    }

    // Nothing to refresh with: behave as before and log out.
    if (!getRefreshToken()) {
      endSession('Your session has expired. Please log in again.');
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const nextToken = await refreshAccessToken();
      originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${nextToken}` };
      return api(originalRequest);
    } catch {
      endSession('Your session has expired. Please log in again.');
      return Promise.reject(error);
    }
  }
);
export default api;
