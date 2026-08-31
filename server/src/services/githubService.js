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

/**
 * Fetch user contribution intelligence metrics from GitHub Search API.
 * Gracefully handles search rate limits and errors.
 */
const fetchUserContributionsData = async (username) => {
  const result = {
    prsOpened: null,
    prsMerged: null,
    reviewsSubmitted: null,
    externalPRs: null,
    externalIssues: null,
    externalRepos: [],
    source: 'github_search_api',
  };

  const externalReposSet = new Set();
  const cleanUser = String(username || '').trim();
  if (!cleanUser) return result;

  try {
    // 1. Total PRs opened by user
    try {
      const prUrl = `https://api.github.com/search/issues?q=type:pr+author:${encodeURIComponent(cleanUser)}&per_page=30`;
      const { payload: prPayload } = await safeGitHubFetch(prUrl);
      if (typeof prPayload?.total_count === 'number') {
        result.prsOpened = prPayload.total_count;
        if (Array.isArray(prPayload.items)) {
          prPayload.items.forEach((item) => {
            if (item.repository_url) {
              const parts = item.repository_url.split('/');
              const owner = parts[parts.length - 2];
              const repo = parts[parts.length - 1];
              if (owner && owner.toLowerCase() !== cleanUser.toLowerCase()) {
                externalReposSet.add(`${owner}/${repo}`);
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn(`[GitHub API] Search PRs query note for ${cleanUser}:`, e.message);
    }

    // 2. Merged PRs authored by user
    try {
      const mergedUrl = `https://api.github.com/search/issues?q=type:pr+author:${encodeURIComponent(cleanUser)}+is:merged&per_page=1`;
      const { payload: mergedPayload } = await safeGitHubFetch(mergedUrl);
      if (typeof mergedPayload?.total_count === 'number') {
        result.prsMerged = mergedPayload.total_count;
      }
    } catch (e) {
      console.warn(`[GitHub API] Search merged PRs query note for ${cleanUser}:`, e.message);
    }

    // 3. PRs reviewed by user
    try {
      const reviewUrl = `https://api.github.com/search/issues?q=type:pr+reviewed-by:${encodeURIComponent(cleanUser)}&per_page=1`;
      const { payload: reviewPayload } = await safeGitHubFetch(reviewUrl);
      if (typeof reviewPayload?.total_count === 'number') {
        result.reviewsSubmitted = reviewPayload.total_count;
      }
    } catch (e) {
      console.warn(`[GitHub API] Search reviews query note for ${cleanUser}:`, e.message);
    }

    // 4. External PRs (PRs on repos not owned by user)
    try {
      const extPrUrl = `https://api.github.com/search/issues?q=type:pr+author:${encodeURIComponent(cleanUser)}+-user:${encodeURIComponent(cleanUser)}&per_page=30`;
      const { payload: extPrPayload } = await safeGitHubFetch(extPrUrl);
      if (typeof extPrPayload?.total_count === 'number') {
        result.externalPRs = extPrPayload.total_count;
        if (Array.isArray(extPrPayload.items)) {
          extPrPayload.items.forEach((item) => {
            if (item.repository_url) {
              const parts = item.repository_url.split('/');
              const owner = parts[parts.length - 2];
              const repo = parts[parts.length - 1];
              if (owner && owner.toLowerCase() !== cleanUser.toLowerCase()) {
                externalReposSet.add(`${owner}/${repo}`);
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn(`[GitHub API] Search external PRs query note for ${cleanUser}:`, e.message);
    }

    // 5. External Issues (Issues on repos not owned by user)
    try {
      const extIssueUrl = `https://api.github.com/search/issues?q=type:issue+author:${encodeURIComponent(cleanUser)}+-user:${encodeURIComponent(cleanUser)}&per_page=30`;
      const { payload: extIssuePayload } = await safeGitHubFetch(extIssueUrl);
      if (typeof extIssuePayload?.total_count === 'number') {
        result.externalIssues = extIssuePayload.total_count;
        if (Array.isArray(extIssuePayload.items)) {
          extIssuePayload.items.forEach((item) => {
            if (item.repository_url) {
              const parts = item.repository_url.split('/');
              const owner = parts[parts.length - 2];
              const repo = parts[parts.length - 1];
              if (owner && owner.toLowerCase() !== cleanUser.toLowerCase()) {
                externalReposSet.add(`${owner}/${repo}`);
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn(`[GitHub API] Search external issues query note for ${cleanUser}:`, e.message);
    }

    result.externalRepos = Array.from(externalReposSet);
  } catch (err) {
    console.warn(`[GitHub API] Search API general fallback for ${cleanUser}:`, err.message);
  }

  return result;
};

module.exports = {
  safeGitHubFetch,
  fetchUserProfile,
  fetchUserRepositories,
  fetchUserEvents,
  fetchUserContributionsData,
};

