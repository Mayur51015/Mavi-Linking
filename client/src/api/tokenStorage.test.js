import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from './tokenStorage';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('setTokens', () => {
  it('stores both tokens under the shared keys', () => {
    setTokens({ token: 'access-1', refreshToken: 'refresh-1' });

    expect(window.localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('access-1');
    expect(window.localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-1');
  });

  it('leaves the refresh token alone when only an access token is supplied', () => {
    setTokens({ token: 'access-1', refreshToken: 'refresh-1' });
    setTokens({ token: 'access-2' });

    expect(getAccessToken()).toBe('access-2');
    expect(getRefreshToken()).toBe('refresh-1');
  });

  it('removes a token when given an explicit empty value', () => {
    setTokens({ token: 'access-1', refreshToken: 'refresh-1' });
    setTokens({ refreshToken: '' });

    expect(getAccessToken()).toBe('access-1');
    expect(getRefreshToken()).toBeNull();
  });

  it('tolerates being called with no arguments', () => {
    expect(() => setTokens()).not.toThrow();
  });
});

describe('clearTokens', () => {
  it('removes both tokens', () => {
    setTokens({ token: 'access-1', refreshToken: 'refresh-1' });
    clearTokens();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('leaves unrelated keys in place', () => {
    window.localStorage.setItem('theme', 'dark');
    setTokens({ token: 'access-1', refreshToken: 'refresh-1' });
    clearTokens();

    expect(window.localStorage.getItem('theme')).toBe('dark');
  });
});

describe('storage failures', () => {
  it('returns null instead of throwing when reading is blocked', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('swallows a write failure instead of crashing the app', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => setTokens({ token: 'access-1' })).not.toThrow();
  });

  it('swallows a removal failure', () => {
    vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(() => clearTokens()).not.toThrow();
  });
});
