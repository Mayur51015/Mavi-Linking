/**
 * One allowlist, shared by the Express CORS middleware and the Socket.IO
 * handshake.
 *
 * These used to be two separate literals in server.js and config/socket.js, and
 * they had drifted: the socket list was missing both `127.0.0.1:5173` and the
 * deployed Vercel origin. The visible symptom was that on production every REST
 * call worked while every real-time feature silently didn't — chat only arrived
 * after a page reload — because the handshake was being rejected as a CORS
 * failure that the client logged and immediately retried, forever.
 *
 * They also normalised differently. socket.js stripped trailing slashes from
 * both sides; server.js did an exact `includes`. So `CLIENT_URL` with a
 * trailing slash was accepted by one layer and rejected by the other.
 */

// Local development origins. Vite serves on 5173 and will hand out either
// hostname depending on how the dev opened it.
const DEVELOPMENT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173', // vite preview
];

// The current production frontend. Kept here rather than in two files, and
// still overridable — CLIENT_URL accepts a comma-separated list so preview
// deployments can be added without a code change.
const PRODUCTION_ORIGINS = ['https://mavi-linking-mq7d.vercel.app'];

/**
 * Reduce an origin to the form used for comparison: trimmed, lowercased,
 * without a trailing slash.
 *
 * An origin is scheme + host + port and nothing else, so lowercasing is safe —
 * scheme and host are case-insensitive, and there is no path to preserve.
 * Returns null for anything that isn't a usable origin string.
 */
const normalizeOrigin = (origin) => {
  if (typeof origin !== 'string') return null;

  const trimmed = origin.trim().replace(/\/+$/u, '');
  if (!trimmed) return null;

  return trimmed.toLowerCase();
};

/**
 * Build the allowlist for a given environment.
 *
 * Development origins are only included outside production, so a production
 * deployment doesn't quietly accept requests claiming to come from localhost.
 */
const buildAllowedOrigins = (env = process.env) => {
  const configured = String(env.CLIENT_URL || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  const base =
    env.NODE_ENV === 'production'
      ? PRODUCTION_ORIGINS
      : [...DEVELOPMENT_ORIGINS, ...PRODUCTION_ORIGINS];

  return [...new Set([...base.map(normalizeOrigin), ...configured])];
};

/**
 * Whether an origin is allowed.
 *
 * A missing origin is allowed: same-origin requests, curl, Postman and
 * server-to-server callers send no Origin header, and CORS is not what is
 * protecting those routes — authentication is. Rejecting them here would break
 * the health check and every non-browser client without adding any protection,
 * since a browser cannot suppress the header.
 */
const isOriginAllowed = (origin, allowed) => {
  if (origin === undefined || origin === null || origin === '') return true;

  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;

  return allowed.includes(normalized);
};

/**
 * An origin callback in the shape both `cors` and Socket.IO expect.
 *
 * The allowlist is computed once per factory call rather than per request, so
 * `CLIENT_URL` is read at startup — the same moment for both layers, which is
 * the property that was missing before.
 */
const createOriginChecker = (env = process.env) => {
  const allowed = buildAllowedOrigins(env);

  const checker = (origin, callback) => {
    if (isOriginAllowed(origin, allowed)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  };

  // Exposed for logging at boot and for tests, so a misconfiguration is
  // visible in the startup output instead of only as a failed handshake.
  checker.allowedOrigins = allowed;

  return checker;
};

module.exports = {
  DEVELOPMENT_ORIGINS,
  PRODUCTION_ORIGINS,
  normalizeOrigin,
  buildAllowedOrigins,
  isOriginAllowed,
  createOriginChecker,
};
