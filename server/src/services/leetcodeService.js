const axios = require('axios');
const NodeCache = require('node-cache');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Cache for 6 hours
const cache = new NodeCache({ stdTTL: 21600 });
const BASE_URL = 'https://alfa-leetcode-api.onrender.com';

// Timeout for external LeetCode API requests (the proxy is on Render free
// tier and can take a while to cold-start)
const EXTERNAL_TIMEOUT_MS = 15000;

const generateAiInsights = async (stats) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `Analyze this LeetCode profile and provide deep insights.
Stats: Total Solved: ${stats.totalSolved} (Easy: ${stats.easySolved}, Medium: ${stats.mediumSolved}, Hard: ${stats.hardSolved})
Contest Rating: ${stats.contestRating}
Ranking: ${stats.ranking}
Contribution Points: ${stats.contributionPoints}
Reputation: ${stats.reputation}

Respond EXACTLY with valid JSON:
{
  "summary": "2-3 sentences about their competitive programming profile and strengths",
  "problemSolvingScore": 1-100,
  "competitiveProgrammingScore": 1-100,
  "consistencyScore": 1-100,
  "contestPerformanceScore": 1-100
}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('AI Insight Error:', error.message);
    return null;
  }
};

const fetchOfficialLeetCodeGraphQL = async (username) => {
  try {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            ranking
            reputation
          }
          badges {
            id
            name
            displayName
            icon
            category
            creationDate
          }
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
        recentSubmissionList(username: $username, limit: 15) {
          title
          titleSlug
          timestamp
          statusDisplay
          lang
        }
        userContestRanking(username: $username) {
          rating
          globalRanking
        }
      }
    `;

    const res = await axios.post('https://leetcode.com/graphql', {
      query,
      variables: { username }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `https://leetcode.com/${username}/`
      },
      timeout: 10000
    });

    if (res.data?.data?.matchedUser) {
      const user = res.data.data.matchedUser;
      const ac = user.submitStatsGlobal?.acSubmissionNum || [];
      const getCount = (diff) => ac.find(a => a.difficulty.toLowerCase() === diff.toLowerCase())?.count || 0;

      const rawBadges = user.badges || [];
      const rawSubmissions = res.data.data.recentSubmissionList || [];

      const badges = rawBadges.map(b => ({
        id: b.id || b.name,
        name: b.name || b.displayName,
        displayName: b.displayName || b.name,
        icon: b.icon ? (b.icon.startsWith('http') ? b.icon : `https://leetcode.com${b.icon}`) : '',
        category: b.category || 'Achievement',
        creationDate: b.creationDate || null
      }));

      const recentSubmissions = rawSubmissions.map(s => ({
        title: s.title,
        titleSlug: s.titleSlug,
        timestamp: s.timestamp ? parseInt(s.timestamp, 10) : Math.floor(Date.now() / 1000),
        statusDisplay: s.statusDisplay || 'Accepted',
        lang: s.lang || 'Code',
        url: s.titleSlug ? `https://leetcode.com/problems/${s.titleSlug}/` : null
      }));

      return {
        username: user.username || username,
        totalSolved: getCount('All'),
        easySolved: getCount('Easy'),
        mediumSolved: getCount('Medium'),
        hardSolved: getCount('Hard'),
        ranking: user.profile?.ranking || 0,
        contributionPoints: 0,
        reputation: user.profile?.reputation || 0,
        contestRating: res.data.data.userContestRanking?.rating ? Math.round(res.data.data.userContestRanking.rating) : null,
        badges,
        recentSubmissions
      };
    }
  } catch (err) {
    console.warn(`LeetCode official GraphQL query fallback for "${username}": ${err.message}`);
  }
  return null;
};

const fetchLeetCodeData = async (username) => {
  const cleanUsername = username.trim();
  const cacheKey = `leetcode_${cleanUsername}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) return cachedData;

  // 1. Try official LeetCode GraphQL API first
  const graphqlResult = await fetchOfficialLeetCodeGraphQL(cleanUsername);
  if (graphqlResult) {
    try {
      const aiInsight = await generateAiInsights(graphqlResult);
      if (aiInsight) {
        graphqlResult.aiInsight = { ...aiInsight, generatedAt: new Date() };
      }
    } catch (_) {}

    cache.set(cacheKey, graphqlResult);
    return graphqlResult;
  }

  // 2. Fallback to proxy API
  try {
    const reqConfig = { timeout: EXTERNAL_TIMEOUT_MS };
    const [profileRes, contestRes, badgesRes, submissionsRes] = await Promise.allSettled([
      axios.get(`${BASE_URL}/userProfile/${cleanUsername}`, reqConfig),
      axios.get(`${BASE_URL}/${cleanUsername}/contest`, reqConfig),
      axios.get(`${BASE_URL}/${cleanUsername}/badges`, reqConfig),
      axios.get(`${BASE_URL}/${cleanUsername}/acSubmission`, reqConfig)
    ]);

    if (profileRes.status === 'rejected') {
      const reason = profileRes.reason?.message || 'Unknown error';
      console.error(`LeetCode profile fetch failed for "${cleanUsername}":`, reason);
      throw new Error(
        reason.includes('timeout')
          ? 'LeetCode service is temporarily unavailable. Please try again in a moment.'
          : `Could not fetch LeetCode profile for "${cleanUsername}". Please verify the username.`
      );
    }

    if (!profileRes.value?.data || profileRes.value.data.errors) {
      throw new Error(`LeetCode user "${cleanUsername}" not found.`);
    }

    const profile = profileRes.value.data;
    const contest = contestRes.status === 'fulfilled' ? (contestRes.value.data?.contestParticipation || []) : [];
    const badges = badgesRes.status === 'fulfilled' ? (badgesRes.value.data?.badges || []) : [];
    const submissions = submissionsRes.status === 'fulfilled' ? (submissionsRes.value.data?.submission || []) : [];

    const latestContest = contest && contest.length > 0 ? contest[contest.length - 1] : null;

    const data = {
      username: cleanUsername,
      totalSolved: profile.totalSolved || 0,
      easySolved: profile.easySolved || 0,
      mediumSolved: profile.mediumSolved || 0,
      hardSolved: profile.hardSolved || 0,
      ranking: profile.ranking || 0,
      contributionPoints: profile.contributionPoint || 0,
      reputation: profile.reputation || 0,
      contestRating: latestContest ? Math.round(latestContest.rating) : null,
      badges: badges || [],
      recentSubmissions: submissions ? submissions.slice(0, 10) : []
    };

    // AI insights are best-effort
    try {
      const aiInsight = await generateAiInsights(data);
      if (aiInsight) {
        data.aiInsight = {
          ...aiInsight,
          generatedAt: new Date()
        };
      }
    } catch (aiErr) {
      console.error('AI insights skipped during sync:', aiErr.message);
    }

    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    if (error.message && !error.message.startsWith('LeetCode API failed')) {
      throw error;
    }
    throw new Error('LeetCode API failed: ' + error.message);
  }
};

module.exports = {
  fetchLeetCodeData,
};
