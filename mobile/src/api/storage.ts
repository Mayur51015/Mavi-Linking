/**
 * Secure Token Storage
 * ────────────────────
 * Uses expo-secure-store to store sensitive JWT authentication tokens and session keys.
 */

import * as SecureStore from 'expo-secure-store';
import { User } from '../types/models';
import { EnvironmentType, DEFAULT_ENV } from '../config/environment';

const KEYS = {
  TOKEN: 'edutalentx_jwt_token',
  REFRESH_TOKEN: 'edutalentx_refresh_token',
  USER_DATA: 'edutalentx_user_profile',
  ENV_TYPE: 'edutalentx_env_type',
  CUSTOM_API_URL: 'edutalentx_custom_api_url',
};

// In-memory cache for fast synchronous access
let memoryToken: string | null = null;

export const Storage = {
  async getToken(): Promise<string | null> {
    if (memoryToken) return memoryToken;
    try {
      const token = await SecureStore.getItemAsync(KEYS.TOKEN);
      memoryToken = token;
      return token;
    } catch (err) {
      console.warn('[Storage] Failed to read token from SecureStore:', err);
      return memoryToken;
    }
  },

  async setToken(token: string): Promise<void> {
    memoryToken = token;
    try {
      await SecureStore.setItemAsync(KEYS.TOKEN, token);
    } catch (err) {
      console.warn('[Storage] Failed to save token to SecureStore:', err);
    }
  },

  async removeToken(): Promise<void> {
    memoryToken = null;
    try {
      await SecureStore.deleteItemAsync(KEYS.TOKEN);
    } catch (err) {
      console.warn('[Storage] Failed to remove token from SecureStore:', err);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
    } catch (err) {
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
    } catch (err) {
      console.warn('[Storage] Failed to save refresh token:', err);
    }
  },

  async getUser(): Promise<User | null> {
    try {
      const raw = await SecureStore.getItemAsync(KEYS.USER_DATA);
      if (!raw) return null;
      return JSON.parse(raw) as User;
    } catch (err) {
      return null;
    }
  },

  async setUser(user: User): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEYS.USER_DATA, JSON.stringify(user));
    } catch (err) {
      console.warn('[Storage] Failed to save user data:', err);
    }
  },

  async removeUser(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(KEYS.USER_DATA);
    } catch (err) {
      console.warn('[Storage] Failed to remove user data:', err);
    }
  },

  async getEnvironment(): Promise<{ type: EnvironmentType; customUrl?: string }> {
    try {
      const type = (await SecureStore.getItemAsync(KEYS.ENV_TYPE)) as EnvironmentType | null;
      const customUrl = (await SecureStore.getItemAsync(KEYS.CUSTOM_API_URL)) || undefined;
      return {
        type: type || DEFAULT_ENV,
        customUrl,
      };
    } catch {
      return { type: DEFAULT_ENV };
    }
  },

  async setEnvironment(type: EnvironmentType, customUrl?: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEYS.ENV_TYPE, type);
      if (customUrl) {
        await SecureStore.setItemAsync(KEYS.CUSTOM_API_URL, customUrl);
      } else {
        await SecureStore.deleteItemAsync(KEYS.CUSTOM_API_URL);
      }
    } catch (err) {
      console.warn('[Storage] Failed to save environment preference:', err);
    }
  },

  async clearAuth(): Promise<void> {
    memoryToken = null;
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(KEYS.TOKEN),
        SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(KEYS.USER_DATA),
      ]);
    } catch (err) {
      console.warn('[Storage] Failed to clear auth storage:', err);
    }
  },
};
