if (typeof fetch !== 'function') {
  throw new Error('Global fetch is not available. Use Node 18+ or install a fetch-compatible polyfill.');
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

const PLATFORM_DISPLAY_NAMES = {
  github: 'GitHub',
  codeforces: 'Codeforces',
  leetcode: 'LeetCode',
  stackoverflow: 'Stack Overflow',
};

const fetchPlatformProfile = async (platform, username) => {
  switch (platform) {
    case 'github':
      return fetchGitHubProfile(username);
    case 'codeforces':
      return fetchCodeforcesProfile(username);
    case 'leetcode':
      return fetchLeetCodeProfile(username);
    case 'stackoverflow':
      return fetchStackOverflowProfile(username);
    default:
      throw new Error('Unsupported platform');
  }
};

const fetchGitHubProfile = async (username) => {
  const url = `https://api.github.com/users/${encodeURIComponent(username)}`;
  const headers = {
    Accept: 'application/vnd.github+json',
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });
  const payload = await response.json();

  if (!response.ok) {
    const message = payload.message || 'Unable to fetch GitHub profile';
    throw new Error(message);
  }

  // Also fetch user public repositories for richer AI analysis
  let reposList = [];
  try {
    const reposUrl = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=10&sort=updated`;
    const reposResponse = await fetch(reposUrl, { headers });
    if (reposResponse.ok) {
      const reposPayload = await reposResponse.json();
      if (Array.isArray(reposPayload)) {
        reposList = reposPayload.map(r => ({
          name: r.name,
          description: r.description || '',
          language: r.language || '',
          stars: r.stargazers_count || 0,
          forks: r.forks_count || 0,
          updatedAt: r.updated_at
        }));
      }
    }
  } catch (err) {
    console.warn('Unable to fetch GitHub repositories list:', err.message);
  }

  return {
    username: payload.login,
    displayName: payload.name || null,
    avatarUrl: payload.avatar_url || null,
    profileUrl: payload.html_url || null,
    bio: payload.bio || null,
    company: payload.company || null,
    location: payload.location || null,
    publicRepos: payload.public_repos || 0,
    followers: payload.followers || 0,
    following: payload.following || 0,
    createdAt: payload.created_at || null,
    fetchedAt: new Date(),
    repos: reposList
  };
};

const fetchCodeforcesProfile = async (username) => {
  const url = `https://codeforces.com/api/user.info?handles=${encodeURIComponent(username)}`;
  const response = await fetch(url);
  const payload = await response.json();

  if (payload.status !== 'OK' || !Array.isArray(payload.result) || payload.result.length === 0) {
    throw new Error(`Unable to fetch Codeforces profile for ${username}`);
  }

  const profile = payload.result[0];
  return {
    handle: profile.handle,
    rating: profile.rating || null,
    maxRating: profile.maxRating || null,
    rank: profile.rank || null,
    maxRank: profile.maxRank || null,
    contribution: profile.contribution || null,
    organization: profile.organization || null,
    country: profile.country || null,
    city: profile.city || null,
    avatarUrl: profile.titlePhoto || null,
    fetchedAt: new Date(),
  };
};

const fetchLeetCodeProfile = async (username) => {
  const url = 'https://leetcode.com/graphql';
  const query = `query userProfile($username: String!) {\n  matchedUser(username: $username) {\n    username\n    profile {\n      realName\n      userAvatar\n      reputation\n      ranking\n      aboutMe\n      countryName\n      githubUrl\n      twitterUrl\n      linkedinUrl\n    }\n    submitStats {\n      acSubmissionNum {\n        difficulty\n        count\n        label\n      }\n    }\n  }\n}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables: { username } }),
  });

  const payload = await response.json();
  const user = payload?.data?.matchedUser;

  if (!user) {
    throw new Error(`Unable to fetch LeetCode profile for ${username}`);
  }

  const submissionCounts = user.submitStats?.acSubmissionNum || [];
  const totals = {
    easy: null,
    medium: null,
    hard: null,
    all: null,
  };

  submissionCounts.forEach((item) => {
    if (item.label === 'All') totals.all = item.count;
    if (item.label === 'Easy') totals.easy = item.count;
    if (item.label === 'Medium') totals.medium = item.count;
    if (item.label === 'Hard') totals.hard = item.count;
  });

  return {
    username: user.username,
    displayName: user.profile?.realName || null,
    avatarUrl: user.profile?.userAvatar || null,
    profileUrl: `https://leetcode.com/${user.username}`,
    reputation: user.profile?.reputation || null,
    ranking: user.profile?.ranking || null,
    country: user.profile?.countryName || null,
    githubUrl: user.profile?.githubUrl || null,
    twitterUrl: user.profile?.twitterUrl || null,
    linkedinUrl: user.profile?.linkedinUrl || null,
    solved: totals.all,
    solvedEasy: totals.easy,
    solvedMedium: totals.medium,
    solvedHard: totals.hard,
    fetchedAt: new Date(),
  };
};

const fetchStackOverflowProfile = async (userId) => {
  const url = `https://api.stackexchange.com/2.3/users/${encodeURIComponent(userId)}?site=stackoverflow&filter=!9_bDE(fI5`;
  const response = await fetch(url);
  const payload = await response.json();

  if (!payload.items || payload.items.length === 0) {
    throw new Error(`Unable to fetch Stack Overflow profile for ${userId}`);
  }

  const profile = payload.items[0];
  return {
    userId: profile.user_id || null,
    displayName: profile.display_name || null,
    profileImage: profile.profile_image || null,
    profileUrl: profile.link || null,
    reputation: profile.reputation || null,
    acceptRate: profile.accept_rate || null,
    answerCount: profile.answer_count || null,
    questionCount: profile.question_count || null,
    goldBadges: profile.badge_counts?.gold || 0,
    silverBadges: profile.badge_counts?.silver || 0,
    bronzeBadges: profile.badge_counts?.bronze || 0,
    location: profile.location || null,
    fetchedAt: new Date(),
  };
};

module.exports = {
  fetchPlatformProfile,
  PLATFORM_DISPLAY_NAMES,
};
