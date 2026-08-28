const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

const getHeaders = (token = GITHUB_TOKEN) => {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'MaVi-Linking-Intelligence-Engine',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Execute a safe fetch request with automatic rate-limit and token-fallback handling.
 */
const safeGitHubFetch = async (url, token = GITHUB_TOKEN) => {
  let headers = getHeaders(token);
  let response;
  let payload;

  try {
    response = await fetch(url, { headers });
    payload = await response.json();
  } catch (err) {
    throw new Error(`Network error connecting to GitHub API: ${err.message}`);
  }

  // Handle Bad credentials / token expiry: Fallback to unauthenticated public API
  if (!response.ok && (response.status === 401 || (payload.message && payload.message.toLowerCase().includes('bad credentials')))) {
    if (token) {
      console.warn(`[GitHub API] Token invalid for ${url}. Retrying with public unauthenticated request.`);
      headers = getHeaders('');
      try {
        response = await fetch(url, { headers });
        payload = await response.json();
      } catch (err) {
        throw new Error(`Network error during unauthenticated fallback: ${err.message}`);
      }
    }
  }

  // Check rate limit status
  const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
  const rateLimitReset = response.headers.get('x-ratelimit-reset');

  if (response.status === 403 && rateLimitRemaining === '0') {
    const resetDate = rateLimitReset ? new Date(parseInt(rateLimitReset, 10) * 1000).toLocaleTimeString() : 'soon';
    throw new Error(`GitHub API rate limit exceeded. Resets at ${resetDate}.`);
  }

  if (response.status === 404) {
    throw new Error(`GitHub resource not found at ${url}`);
  }

  if (!response.ok) {
    throw new Error(payload.message || `GitHub API returned HTTP ${response.status}`);
  }

  return { payload, rateLimitRemaining, rateLimitReset };
};

/**
 * Fetch public GitHub user profile.
 */
const fetchUserProfile = async (username) => {
  const url = `https://api.github.com/users/${encodeURIComponent(username)}`;
  const { payload } = await safeGitHubFetch(url);
  return payload;
};

/**
 * Fetch up to 100 most recently updated public repositories.
 */
const fetchUserRepositories = async (username, maxCount = 100) => {
  try {
    const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=${Math.min(maxCount, 100)}&sort=updated&type=all`;
    const { payload } = await safeGitHubFetch(url);
    return Array.isArray(payload) ? payload : [];
  } catch (err) {
    console.warn(`[GitHub API] Failed to fetch repositories for ${username}:`, err.message);
    throw err;
  }
};

/**
 * Fetch up to 100 public events (push, PR, issue, release).
 */
const fetchUserEvents = async (username, maxCount = 100) => {
  try {
    const url = `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=${Math.min(maxCount, 100)}`;
    const { payload } = await safeGitHubFetch(url);
    return Array.isArray(payload) ? payload : [];
  } catch (err) {
    console.warn(`[GitHub API] Failed to fetch public events for ${username}:`, err.message);
    throw err;
  }
};

module.exports = {
  safeGitHubFetch,
  fetchUserProfile,
  fetchUserRepositories,
  fetchUserEvents,
};
