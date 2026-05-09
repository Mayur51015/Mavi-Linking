const User = require('../models/User');
const Insight = require('../models/Insight');
const DNA = require('../models/DNA');
const Ranking = require('../models/Ranking');
const RecruiterBookmark = require('../models/RecruiterBookmark');

/**
 * Search developers with filters.
 */
const searchDevelopers = async (filters = {}) => {
  const {
    skills, minScore, maxScore, tier,
    university, department,
    page = 1, limit = 20, sortBy = 'scores.overall', order = 'desc',
  } = filters;

  const query = { role: 'developer', isPublic: true };

  if (minScore) query['scores.overall'] = { ...query['scores.overall'], $gte: parseInt(minScore) };
  if (maxScore) query['scores.overall'] = { ...query['scores.overall'], $lte: parseInt(maxScore) };
  if (university) query['university.name'] = new RegExp(university, 'i');
  if (department) query['university.department'] = new RegExp(department, 'i');

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortDirection = order === 'asc' ? 1 : -1;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('name username avatar scores platforms.github.username university isVerified')
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(query),
  ]);

  // If skill filter is provided, post-filter using insights
  let results = users;
  if (skills && skills.length > 0) {
    const userIds = users.map(u => u._id);
    const insights = await Insight.find({
      userId: { $in: userIds },
      topSkills: { $in: skills },
    });
    const matchedIds = new Set(insights.map(i => i.userId.toString()));
    results = users.filter(u => matchedIds.has(u._id.toString()));
  }

  return {
    developers: results,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/**
 * Compare multiple developer profiles side by side.
 */
const compareDevelopers = async (developerIds) => {
  if (!Array.isArray(developerIds) || developerIds.length < 2) {
    throw new Error('At least 2 developer IDs are required.');
  }

  const users = await User.find({ _id: { $in: developerIds } })
    .select('name username avatar scores platforms platformData university isVerified');

  const [insights, dnas, rankings] = await Promise.all([
    Insight.find({ userId: { $in: developerIds } }),
    DNA.find({ userId: { $in: developerIds } }),
    Ranking.find({ userId: { $in: developerIds } }),
  ]);

  const insightMap = Object.fromEntries(insights.map(i => [i.userId.toString(), i]));
  const dnaMap = Object.fromEntries(dnas.map(d => [d.userId.toString(), d]));
  const rankingMap = Object.fromEntries(rankings.map(r => [r.userId.toString(), r]));

  return users.map(u => ({
    id: u._id,
    name: u.name,
    username: u.username || u.platforms?.github?.username,
    avatar: u.avatar,
    scores: u.scores,
    isVerified: u.isVerified,
    university: u.university,
    insight: insightMap[u._id.toString()] || null,
    dna: dnaMap[u._id.toString()] || null,
    ranking: rankingMap[u._id.toString()] || null,
  }));
};

/**
 * Bookmark a developer.
 */
const bookmarkDeveloper = async (recruiterId, developerId, notes = '', tags = []) => {
  return RecruiterBookmark.findOneAndUpdate(
    { recruiterId, developerId },
    { recruiterId, developerId, notes, tags },
    { new: true, upsert: true }
  );
};

/**
 * Remove a bookmark.
 */
const removeBookmark = async (recruiterId, developerId) => {
  return RecruiterBookmark.findOneAndDelete({ recruiterId, developerId });
};

/**
 * Get all bookmarks for a recruiter.
 */
const getBookmarks = async (recruiterId, status) => {
  const query = { recruiterId };
  if (status) query.status = status;

  return RecruiterBookmark.find(query)
    .populate('developerId', 'name username avatar scores isVerified university')
    .sort({ updatedAt: -1 });
};

/**
 * Update bookmark status/notes.
 */
const updateBookmark = async (recruiterId, developerId, updates) => {
  return RecruiterBookmark.findOneAndUpdate(
    { recruiterId, developerId },
    { $set: updates },
    { new: true }
  );
};

module.exports = {
  searchDevelopers,
  compareDevelopers,
  bookmarkDeveloper,
  removeBookmark,
  getBookmarks,
  updateBookmark,
};
