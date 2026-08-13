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

const fetchLeetCodeData = async (username) => {
  const cacheKey = `leetcode_${username}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) return cachedData;

  try {
    const reqConfig = { timeout: EXTERNAL_TIMEOUT_MS };
    const [profileRes, contestRes, badgesRes, submissionsRes] = await Promise.allSettled([
      axios.get(`${BASE_URL}/userProfile/${username}`, reqConfig),
      axios.get(`${BASE_URL}/${username}/contest`, reqConfig),
      axios.get(`${BASE_URL}/${username}/badges`, reqConfig),
      axios.get(`${BASE_URL}/${username}/acSubmission`, reqConfig)
    ]);

    if (profileRes.status === 'rejected') {
      const reason = profileRes.reason?.message || 'Unknown error';
      console.error(`LeetCode profile fetch failed for "${username}":`, reason);
      throw new Error(
        reason.includes('timeout')
          ? 'LeetCode service is temporarily unavailable. Please try again in a moment.'
          : `Could not fetch LeetCode profile for "${username}". Please verify the username.`
      );
    }

    if (!profileRes.value?.data) {
      throw new Error(`LeetCode user "${username}" not found.`);
    }

    const profile = profileRes.value.data;
    const contest = contestRes.status === 'fulfilled' ? (contestRes.value.data?.contestParticipation || []) : [];
    const badges = badgesRes.status === 'fulfilled' ? (badgesRes.value.data?.badges || []) : [];
    const submissions = submissionsRes.status === 'fulfilled' ? (submissionsRes.value.data?.submission || []) : [];

    const latestContest = contest && contest.length > 0 ? contest[contest.length - 1] : null;

    const data = {
      username,
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

    // AI insights are best-effort — never let them block or crash the sync
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
    // Re-throw with original message if it's already user-friendly
    if (error.message && !error.message.startsWith('LeetCode API failed')) {
      throw error;
    }
    throw new Error('LeetCode API failed: ' + error.message);
  }
};

module.exports = {
  fetchLeetCodeData,
};
