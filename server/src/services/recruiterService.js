const User = require('../models/User');
const Insight = require('../models/Insight');
const DNA = require('../models/DNA');
const Ranking = require('../models/Ranking');
const RecruiterBookmark = require('../models/RecruiterBookmark');

/**
 * Get recruiter dashboard stats (scoped to allowed colleges/departments).
 */
const getRecruiterStats = async (recruiter) => {
  const query = { role: 'user', isPublic: true };

  // Scope to allowed colleges/departments if set — also include unaffiliated students
  const scopeConditions = [];
  if (recruiter.allowedColleges && recruiter.allowedColleges.length > 0) {
    scopeConditions.push({
      'university.name': { $in: recruiter.allowedColleges.map(c => new RegExp(c, 'i')) },
    });
  }
  if (recruiter.allowedDepartments && recruiter.allowedDepartments.length > 0) {
    scopeConditions.push({
      'university.department': { $in: recruiter.allowedDepartments.map(d => new RegExp(d, 'i')) },
    });
  }
  if (scopeConditions.length > 0) {
    // Include students that match the scope OR have no university set
    const unaffiliatedCondition = {
      $or: [
        { 'university.name': { $in: ['', null] } },
        { 'university.name': { $exists: false } },
      ],
    };
    query.$or = [...scopeConditions, unaffiliatedCondition];
  }

  const [totalCandidates, bookmarkCount, topCandidates] = await Promise.all([
    User.countDocuments(query),
    RecruiterBookmark.countDocuments({ recruiterId: recruiter._id }),
    User.find(query).sort({ 'scores.overall': -1 }).limit(5).select('name scores university'),
  ]);

  // Calculate average score
  const avgResult = await User.aggregate([
    { $match: query },
    { $group: { _id: null, avgScore: { $avg: '$scores.overall' } } },
  ]);

  return {
    totalCandidates,
    bookmarkedCount: bookmarkCount,
    averageScore: Math.round(avgResult[0]?.avgScore || 0),
    topCandidates,
    allowedColleges: recruiter.allowedColleges || [],
    allowedDepartments: recruiter.allowedDepartments || [],
  };
};

/**
 * Search developers with filters. Scoped to recruiter's allowed colleges/departments.
 */
const searchDevelopers = async (filters = {}, recruiter = null) => {
  const {
    skills, minScore, maxScore, minReadiness, tier,
    university, department, graduationYear, experienceLevel, isVerified,
    page = 1, limit = 20, sortBy = 'scores.overall', order = 'desc',
  } = filters;

  const query = { role: 'user', isPublic: true };

  // Resolve skill filter beforehand to ensure correct database pagination
  if (skills && skills.length > 0) {
    const insights = await Insight.find({
      topSkills: { $in: skills }
    }).select('userId');
    const skillUserIds = insights.map(i => i.userId.toString());
    query._id = { $in: skillUserIds };
  }

  // Resolve tier filter beforehand
  if (tier) {
    const rankings = await Ranking.find({ tier }).select('userId');
    const tierUserIds = rankings.map(r => r.userId.toString());
    if (query._id) {
      const currentIds = new Set(query._id.$in);
      const intersection = tierUserIds.filter(id => currentIds.has(id));
      query._id = { $in: intersection };
    } else {
      query._id = { $in: tierUserIds };
    }
  }

  if (minScore) query['scores.overall'] = { ...query['scores.overall'], $gte: parseInt(minScore) };
  if (maxScore) query['scores.overall'] = { ...query['scores.overall'], $lte: parseInt(maxScore) };
  if (minReadiness) query['placementReadinessScore'] = { $gte: parseInt(minReadiness) };
  if (graduationYear) query['university.batch'] = graduationYear;
  if (experienceLevel) query['experienceLevel'] = experienceLevel;
  if (isVerified !== undefined) query['isVerified'] = isVerified === 'true';

  // Apply recruiter's scoped access
  if (recruiter && recruiter.allowedColleges && recruiter.allowedColleges.length > 0) {
    if (university) {
      // Validate that the requested university is within the recruiter's allowed list
      const isAllowed = recruiter.allowedColleges.some(c => 
        new RegExp(c, 'i').test(university) || new RegExp(university, 'i').test(c)
      );
      if (!isAllowed) {
        return { developers: [], pagination: { total: 0, page: 1, pages: 0 } };
      }
      query['university.name'] = new RegExp(university, 'i');
    } else {
      // Show students from allowed colleges + unaffiliated students
      query.$or = [
        { 'university.name': { $in: recruiter.allowedColleges.map(c => new RegExp(c, 'i')) } },
        { 'university.name': { $in: ['', null] } },
        { 'university.name': { $exists: false } },
      ];
    }
  } else if (university) {
    query['university.name'] = new RegExp(university, 'i');
  }

  if (recruiter && recruiter.allowedDepartments && recruiter.allowedDepartments.length > 0) {
    if (department) {
      const isAllowed = recruiter.allowedDepartments.some(d => 
        new RegExp(d, 'i').test(department) || new RegExp(department, 'i').test(d)
      );
      if (!isAllowed) {
        return { developers: [], pagination: { total: 0, page: 1, pages: 0 } };
      }
      query['university.department'] = new RegExp(department, 'i');
    } else if (!query.$or) {
      // Only add department scope if we haven't already used $or for colleges
      // (avoid conflicting $or conditions)
      query.$or = [
        { 'university.department': { $in: recruiter.allowedDepartments.map(d => new RegExp(d, 'i')) } },
        { 'university.department': { $in: ['', null] } },
        { 'university.department': { $exists: false } },
      ];
    }
  } else if (department) {
    query['university.department'] = new RegExp(department, 'i');
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortDirection = order === 'asc' ? 1 : -1;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('name username avatar scores placementReadinessScore aiAnalysis platforms.github.username university isVerified preferredDomain experienceLevel placementStatus availabilitySettings placedCompany placedRole')
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(query),
  ]);

  return {
    developers: users,
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
  getRecruiterStats,
  searchDevelopers,
  compareDevelopers,
  bookmarkDeveloper,
  removeBookmark,
  getBookmarks,
  updateBookmark,
};
