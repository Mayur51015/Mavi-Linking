/**
 * Centralized Mobile API Client
 * ─────────────────────────────
 * Axios instance with JWT interceptors, dynamic environment switching,
 * automatic session invalidation on 401, and timeout protection.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Storage } from './storage';
import { ENVIRONMENTS, DEFAULT_ENV, EnvironmentType } from '../config/environment';

let currentBaseUrl: string = ENVIRONMENTS[DEFAULT_ENV].apiUrl;
let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorizedListener = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

export const getApiBaseUrl = (): string => currentBaseUrl;

export const updateApiBaseUrl = (url: string) => {
  currentBaseUrl = url.replace(/\/+$/u, '').endsWith('/api')
    ? url.replace(/\/+$/u, '')
    : `${url.replace(/\/+$/u, '')}/api`;
  api.defaults.baseURL = currentBaseUrl;
};

// Initialize base URL from stored settings
export const initApiClient = async (): Promise<string> => {
  const stored = await Storage.getEnvironment();
  if (stored.type === 'custom' && stored.customUrl) {
    updateApiBaseUrl(stored.customUrl);
  } else if (ENVIRONMENTS[stored.type]) {
    updateApiBaseUrl(ENVIRONMENTS[stored.type].apiUrl);
  }
  return currentBaseUrl;
};

export const api = axios.create({
  baseURL: currentBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 20000,
});

// ─── Request Interceptor: Attach JWT ────────────────────────────────────────
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const isPublic = config.url && (
      config.url.endsWith('/auth/login') ||
      config.url.endsWith('/auth/admin-login') ||
      config.url.endsWith('/auth/super-admin-login') ||
      config.url.endsWith('/auth/register') ||
      config.url.endsWith('/auth/forgot-password') ||
      config.url.endsWith('/health')
    );

    if (!isPublic) {
      const token = await Storage.getToken();
      if (token && token.trim()) {
        config.headers.Authorization = `Bearer ${token.trim()}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle Errors & Expirations ───────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; errors?: any[] }>) => {
    if (!error.response) {
      console.warn('[Mobile API] Network connection issue:', error.message);
      return Promise.reject(new Error('Cannot reach the EduTalentX server. Please check your network connection or server URL.'));
    }

    const { status, data } = error.response;
    const message = data?.message || (Array.isArray(data?.errors) ? data.errors.map((e: any) => e.message || e.msg).join(', ') : `Server returned ${status}`);

    if (status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/admin-login') ||
        error.config?.url?.includes('/auth/super-admin-login');

      if (!isLoginRequest) {
        console.warn('[Mobile API] Session expired or invalid token (401). Clearing session.');
        await Storage.clearAuth();
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
