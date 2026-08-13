// ─── Token Storage ──────────────────────────────────────────────────────────
// One place that knows the localStorage keys, so the axios interceptor and
// AuthContext can't drift apart on naming or forget to clear one of the pair.

export const ACCESS_TOKEN_KEY = 'token';
export const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * localStorage throws in a few real situations — Safari private browsing, a
 * blocked third-party context, storage quota. None of those should crash the
 * app, so every access is guarded.
 */
const safeRead = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeWrite = (key, value) => {
  try {
    if (value) {
      window.localStorage.setItem(key, value);
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Nothing useful to do — the session just won't survive a reload.
  }
};

export const getAccessToken = () => safeRead(ACCESS_TOKEN_KEY);

export const getRefreshToken = () => safeRead(REFRESH_TOKEN_KEY);

/**
 * Persist a token pair. The refresh token is optional so callers that only
 * received a new access token (from POST /auth/refresh) don't have to
 * re-supply one.
 *
 * @param {{ token?: string, refreshToken?: string }} tokens
 */
export const setTokens = ({ token, refreshToken } = {}) => {
  if (token !== undefined) safeWrite(ACCESS_TOKEN_KEY, token);
  if (refreshToken !== undefined) safeWrite(REFRESH_TOKEN_KEY, refreshToken);
};

/** Drop both tokens. Used on logout and on a failed refresh. */
export const clearTokens = () => {
  safeWrite(ACCESS_TOKEN_KEY, null);
  safeWrite(REFRESH_TOKEN_KEY, null);
};
