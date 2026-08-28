const NodeCache = require('node-cache');
const User = require('../models/User');
const Ranking = require('../models/Ranking');
const {
  PRIVILEGED_ROLES,
  calculateScoreTier,
} = require('../utils/leaderboardHelper');

const leaderboardCache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120,
});

const GLOBAL_CACHE_KEY = 'leaderboard:global';
const DEPARTMENT_CACHE_PREFIX = 'leaderboard:department:';

const invalidateLeaderboardCache = (departmentId = null) => {
  leaderboardCache.del(GLOBAL_CACHE_KEY);

  if (departmentId) {
    leaderboardCache.del(
      `${DEPARTMENT_CACHE_PREFIX}${departmentId}`
    );
  }
};

const isEligible = (user) =>
  !PRIVILEGED_ROLES.includes(user.role) &&
  user.status !== 'suspended' &&
  (user.scores?.overall || 0) > 0;

const calculateUserRank = async (user) => {
  if (!isEligible(user)) {
    return {
      globalRank: 0,
      departmentRank: 0,
    };
  }

  const sort = {
    'scores.overall': -1,
    'scores.problemSolving': -1,
    'scores.development': -1,
    maviId: 1,
    _id: 1,
  };

  const betterThanUserQuery = {
    role: { $nin: PRIVILEGED_ROLES },
    status: { $ne: 'suspended' },
    'scores.overall': { $gt: 0 },
    $or: [
      { 'scores.overall': { $gt: user.scores.overall } },
      {
        'scores.overall': user.scores.overall,
        'scores.problemSolving': { $gt: user.scores.problemSolving || 0 },
      },
      {
        'scores.overall': user.scores.overall,
        'scores.problemSolving': user.scores.problemSolving || 0,
        'scores.development': { $gt: user.scores.development || 0 },
      },
      {
        'scores.overall': user.scores.overall,
        'scores.problemSolving': user.scores.problemSolving || 0,
        'scores.development': user.scores.development || 0,
        maviId: { $lt: user.maviId || '' },
      },
    ],
  };

  const globalRank =
    (await User.countDocuments(betterThanUserQuery)) + 1;

  let departmentRank = 0;

  if (user.departmentId) {
    departmentRank =
      (await User.countDocuments({
        ...betterThanUserQuery,
        departmentId: user.departmentId,
      })) + 1;
  }

  return {
    globalRank,
    departmentRank,
  };
};

const updateUserRanking = async (user) => {
  const previousRanking = await Ranking.findOne({
    userId: user._id,
  }).lean();

  if (!isEligible(user)) {
    await Ranking.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          score: 0,
          globalRank: 0,
          departmentRank: 0,
          lastUpdated: new Date(),
        },
      },
      { upsert: true }
    );

    invalidateLeaderboardCache(user.departmentId);
    return null;
  }

  const { globalRank, departmentRank } =
    await calculateUserRank(user);

  const ranking = await Ranking.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        score: user.scores.overall,
        tier: calculateScoreTier(user.scores.overall),
        globalRank,
        departmentRank,
        lastUpdated: new Date(),
      },
    },
    {
      new: true,
      upsert: true,
    }
  );

  const scoreChanged =
    previousRanking?.score !== user.scores.overall;

  const rankChanged =
    previousRanking?.globalRank !== globalRank ||
    previousRanking?.departmentRank !== departmentRank;

  if (scoreChanged || rankChanged) {
    invalidateLeaderboardCache(user.departmentId);
  }

  return ranking;
};

const getLeaderboardPage = async ({
  departmentId = null,
  page = 1,
  limit = 10,
}) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const skip = (safePage - 1) * safeLimit;

  const cacheKey = departmentId
    ? `${DEPARTMENT_CACHE_PREFIX}${departmentId}:${safePage}:${safeLimit}`
    : `${GLOBAL_CACHE_KEY}:${safePage}:${safeLimit}`;

  const cached = leaderboardCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const query = {
    role: { $nin: PRIVILEGED_ROLES },
    status: { $ne: 'suspended' },
    'scores.overall': { $gt: 0 },
  };

  if (departmentId) {
    query.departmentId = departmentId;
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select(
        'name avatar maviId scores role status platforms departmentId'
      )
      .sort({
        'scores.overall': -1,
        'scores.problemSolving': -1,
        'scores.development': -1,
        maviId: 1,
        _id: 1,
      })
      .skip(skip)
      .limit(safeLimit)
      .lean(),

    User.countDocuments(query),
  ]);

  const leaderboard = users.map((user, index) => ({
    _id: user._id,
    rank: skip + index + 1,
    score: user.scores?.overall || 0,
    scoreTier: calculateScoreTier(user.scores?.overall || 0),
    scores: user.scores,
    user: {
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
      maviId: user.maviId,
      role: user.role,
      platforms: user.platforms,
    },
  }));

  const result = {
    leaderboard,
    pagination: {
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit),
    },
  };

  leaderboardCache.set(cacheKey, result);

  return result;
};

const rebuildRankings = async () => {
  await Ranking.deleteMany({});

  const users = await User.find({
    role: { $nin: PRIVILEGED_ROLES },
    status: { $ne: 'suspended' },
    'scores.overall': { $gt: 0 },
  })
    .select('_id scores role status departmentId maviId')
    .lean();

  const sortedUsers = [...users].sort((a, b) => {
    if (b.scores.overall !== a.scores.overall) {
      return b.scores.overall - a.scores.overall;
    }

    if (
      (b.scores.problemSolving || 0) !==
      (a.scores.problemSolving || 0)
    ) {
      return (
        (b.scores.problemSolving || 0) -
        (a.scores.problemSolving || 0)
      );
    }

    if (
      (b.scores.development || 0) !==
      (a.scores.development || 0)
    ) {
      return (
        (b.scores.development || 0) -
        (a.scores.development || 0)
      );
    }

    return String(a.maviId || a._id).localeCompare(
      String(b.maviId || b._id)
    );
  });

  const departmentUsers = new Map();

  for (const user of sortedUsers) {
    if (!user.departmentId) continue;

    const key = String(user.departmentId);

    if (!departmentUsers.has(key)) {
      departmentUsers.set(key, []);
    }

    departmentUsers.get(key).push(user);
  }

  const documents = sortedUsers.map((user, index) => {
    const departmentList = user.departmentId
      ? departmentUsers.get(String(user.departmentId)) || []
      : [];

    const departmentIndex = departmentList.findIndex(
      (item) => String(item._id) === String(user._id)
    );

    return {
      userId: user._id,
      score: user.scores.overall,
      tier: calculateScoreTier(user.scores.overall),
      globalRank: index + 1,
      departmentRank:
        departmentIndex === -1 ? 0 : departmentIndex + 1,
      lastUpdated: new Date(),
    };
  });

  if (documents.length) {
    await Ranking.insertMany(documents);
  }

  leaderboardCache.flushAll();

  return {
    rebuiltUsers: documents.length,
  };
};

module.exports = {
  updateUserRanking,
  getLeaderboardPage,
  invalidateLeaderboardCache,
  rebuildRankings,
};