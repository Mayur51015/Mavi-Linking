const User = require('../models/User');
const Project = require('../models/Project');
const Insight = require('../models/Insight');
const DNA = require('../models/DNA');
const Ranking = require('../models/Ranking');
const Analytics = require('../models/Analytics');

const normalizeUsername = (s) => (s || '').toString().trim().toLowerCase();

/**
 * Find user by username or platform username.
 */
const findUserByHandle = async (username) => {
  // First try the dedicated username field
  let user = await User.findOne({ username, isPublic: true }).select('-password -__v');
  if (user) return user;

  // Fallback: search platform usernames
  user = await User.findOne({
    isPublic: { $ne: false },
    $or: [
      { 'platforms.github.username': username },
      { 'platforms.leetcode.username': username },
      { 'platforms.codeforces.username': username },
      { 'platforms.stackoverflow.username': username },
    ],
  }).select('-password -__v');

  return user;
};

/**
 * Public profile by username: /api/public/u/:username
 */
const getPublicProfileByUsername = async (req, res, next) => {
  try {
    const username = normalizeUsername(req.params.username);
    const user = await findUserByHandle(username);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Developer profile not found',
      });
    }

    const projects = await Project.find({ user: user._id })
      .select('-user -__v -updatedAt')
      .sort({ featured: -1, createdAt: -1 });

    const [insight, dna, ranking, analytics] = await Promise.all([
      Insight.findOne({ userId: user._id }).lean(),
      DNA.findOne({ userId: user._id }).lean(),
      Ranking.findOne({ userId: user._id }).lean(),
      Analytics.find({ userId: user._id }).sort({ month: -1 }).limit(12).lean(),
    ]);

    // Lightweight stats composition
    const github = user.platformData?.github || null;
    const leetcode = user.platformData?.leetcode || null;
    const codeforces = user.platformData?.codeforces || null;
    const stackoverflow = user.platformData?.stackoverflow || null;

    const publicProfile = {
      profile: {
        id: user._id,
        name: user.name,
        username: user.username || user.platforms?.github?.username || username,
        avatar: user.avatar,
        bio: user.bio || github?.bio || null,
        isPublic: true,
        isVerified: user.isVerified || false,
        university: user.university || null,
      },
      scores: user.scores || { development: 0, problemSolving: 0, knowledge: 0, overall: 0 },
      aiInsights: insight
        ? {
          specialization: insight.specialization,
          topSkills: insight.topSkills,
          techStack: insight.techStack,
          confidenceScores: Object.fromEntries(insight.confidenceScores || new Map()),
          strengths: insight.strengths,
          improvements: insight.improvements,
          careerRecommendations: insight.careerRecommendations,
          rawAiSummary: insight.rawAiSummary,
        }
        : null,
      dna: dna
        ? {
          personalityType: dna.personalityType,
          workingStyle: dna.workingStyle,
          scores: dna.scores,
          extendedScores: dna.extendedScores || null,
          description: dna.description,
          strengths: dna.strengths || [],
          weaknesses: dna.weaknesses || [],
          evolution: (dna.evolution || []).slice(-10), // last 10 evolution points
        }
        : null,
      ranking: ranking
        ? {
          tier: ranking.tier,
          globalRank: ranking.globalRank,
          score: ranking.score,
          categoryRanks: ranking.categoryRanks || null,
          history: (ranking.history || []).slice(-20),
          lastUpdated: ranking.lastUpdated,
        }
        : null,
      analytics: analytics || [],
      stats: {
        github: github
          ? {
            publicRepos: github.publicRepos,
            followers: github.followers,
            following: github.following,
            company: github.company,
            location: github.location,
            bio: github.bio,
            createdAt: github.createdAt,
          }
          : null,
        leetcode: leetcode
          ? {
            solved: leetcode.solved,
            easy: leetcode.solvedEasy,
            medium: leetcode.solvedMedium,
            hard: leetcode.solvedHard,
            ranking: leetcode.ranking,
          }
          : null,
        codeforces: codeforces
          ? {
            rating: codeforces.rating,
            maxRating: codeforces.maxRating,
            rank: codeforces.rank,
            maxRank: codeforces.maxRank,
            contribution: codeforces.contribution,
          }
          : null,
        stackoverflow: stackoverflow
          ? {
            reputation: stackoverflow.reputation,
            badges: {
              gold: stackoverflow.goldBadges,
              silver: stackoverflow.silverBadges,
              bronze: stackoverflow.bronzeBadges,
            },
            answerCount: stackoverflow.answerCount,
            questionCount: stackoverflow.questionCount,
          }
          : null,
      },
      projects,
    };

    res.status(200).json({ success: true, data: publicProfile });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicProfileByUsername,
};
