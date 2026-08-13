// ─── Single-flight refresh ──────────────────────────────────────────────────
// A dashboard fires several requests at once, so when the access token expires
// they all 401 together. Without coordination each one would POST /auth/refresh
// independently; because the server rotates the refresh token on every call,
// the second request would present a token the first has already invalidated
// and the user would be logged out anyway.
//
// This wraps a refresh function so concurrent callers share one in-flight
// request and all receive the same new access token.

/**
 * @param {() => Promise<string>} refreshFn performs the actual refresh and
 *   resolves with the new access token
 * @returns {() => Promise<string>} a coalescing wrapper around refreshFn
 */
export function createSessionRefresher(refreshFn) {
  let inFlight = null;

  return function refresh() {
    if (inFlight) return inFlight;

    inFlight = Promise.resolve()
      .then(refreshFn)
      .finally(() => {
        // Cleared on both success and failure, so a later 401 can try again
        // rather than replaying a settled promise forever.
        inFlight = null;
      });

    return inFlight;
  };
}

// Endpoints where a 401 is the answer, not a signal that the session lapsed.
// Retrying these would turn a wrong password into a refresh attempt, and
// refreshing the refresh call itself would loop.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/google', '/auth/github'];

/**
 * @param {string} [url] request URL, absolute or relative
 * @returns {boolean} true when a 401 from this URL should not trigger a refresh
 */
export function isAuthEndpoint(url) {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

export { AUTH_ENDPOINTS };
