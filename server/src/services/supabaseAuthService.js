const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

let supabaseAdminClient = null;

// Short-lived in-memory cache for validated Supabase tokens (TTL: 60s)
const tokenVerificationCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

/**
 * Get or initialize Supabase Admin client with Service Role Key
 */
const getSupabaseAdminClient = () => {
  if (supabaseAdminClient) {
    return supabaseAdminClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  try {
    supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    return supabaseAdminClient;
  } catch (err) {
    console.error('[Supabase AuthService] Initialization error:', err.message);
    return null;
  }
};

/**
 * Inspect a JWT candidate to see if it was issued by Supabase
 * (does NOT trust unverified claims; used only to route verification)
 */
const isSupabaseTokenCandidate = (token) => {
  if (!token || typeof token !== 'string') return false;

  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.payload) return false;

    const payload = decoded.payload;
    const iss = payload.iss || '';
    const aud = payload.aud || '';

    // Supabase Auth tokens have iss with supabase.co or aud = 'authenticated'
    if (iss.includes('supabase') || aud === 'authenticated' || payload.app_metadata) {
      return true;
    }

    return false;
  } catch (_) {
    return false;
  }
};

/**
 * Verify a Supabase access token cryptographically and validate claims.
 * Checks issuer, audience, expiration, and user identity via Supabase Auth API.
 *
 * @param {string} token - The Bearer access token
 * @returns {Promise<{ valid: boolean, user?: object, error?: string }>}
 */
const verifySupabaseToken = async (token) => {
  if (!token) {
    return { valid: false, error: 'Token missing' };
  }

  // 1. Check short-lived cache to avoid redundant network hops
  const cached = tokenVerificationCache.get(token);
  if (cached && Date.now() < cached.expiresAt) {
    return { valid: true, user: cached.user };
  }

  // 2. Decode claims to pre-check expiration
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp <= now) {
        tokenVerificationCache.delete(token);
        return { valid: false, error: 'TokenExpiredError' };
      }
    }
  } catch (_) {
    return { valid: false, error: 'JsonWebTokenError' };
  }

  // 3. Verify against Supabase client
  const client = getSupabaseAdminClient();
  if (!client) {
    return { valid: false, error: 'SUPABASE_NOT_CONFIGURED' };
  }

  try {
    const { data, error } = await client.auth.getUser(token);

    if (error || !data?.user) {
      tokenVerificationCache.delete(token);
      return { valid: false, error: error?.message || 'Invalid Supabase token' };
    }

    const supabaseUser = data.user;

    // Cache valid verification for up to 60s (or token expiry, whichever is sooner)
    const tokenExpSec = jwt.decode(token)?.exp || Math.floor(Date.now() / 1000) + 60;
    const cacheExpiresAt = Math.min(Date.now() + CACHE_TTL_MS, tokenExpSec * 1000);

    tokenVerificationCache.set(token, {
      user: supabaseUser,
      expiresAt: cacheExpiresAt,
    });

    return { valid: true, user: supabaseUser };
  } catch (err) {
    return { valid: false, error: err.message };
  }
};

module.exports = {
  getSupabaseAdminClient,
  isSupabaseTokenCandidate,
  verifySupabaseToken,
};
