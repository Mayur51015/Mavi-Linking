const User = require('../models/User');
const Ranking = require('../models/Ranking');
const Analytics = require('../models/Analytics');

/**
 * Get all students for a given university (and optionally department/batch).
 */
const getStudentsByUniversity = async (filters = {}) => {
  const { university, department, batch, page = 1, limit = 50 } = filters;

  const query = { role: 'developer' };
  if (university) query['university.name'] = new RegExp(university, 'i');
  if (department) query['university.department'] = new RegExp(department, 'i');
  if (batch) query['university.batch'] = batch;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [students, total] = await Promise.all([
    User.find(query)
      .select('name username avatar scores platforms.github.username university isVerified lastSyncedAt')
      .sort({ 'scores.overall': -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(query),
  ]);

  return {
    students,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/**
 * Get placement readiness analytics for a batch of students.
 */
const getPlacementReadiness = async (university, department) => {
  const query = { role: 'developer' };
  if (university) query['university.name'] = new RegExp(university, 'i');
  if (department) query['university.department'] = new RegExp(department, 'i');

  const students = await User.find(query).select('name scores platforms');
  
  if (students.length === 0) {
    return { totalStudents: 0, readiness: [], averages: {} };
  }

  // Categorize students by readiness
  const tiers = {
    excellent: { min: 700, students: [] },
    good: { min: 400, students: [] },
    developing: { min: 200, students: [] },
    beginner: { min: 0, students: [] },
  };

  let totalDev = 0, totalPS = 0, totalKnowledge = 0;

  for (const student of students) {
    const overall = student.scores?.overall || 0;
    totalDev += student.scores?.development || 0;
    totalPS += student.scores?.problemSolving || 0;
    totalKnowledge += student.scores?.knowledge || 0;

    const entry = { name: student.name, score: overall };
    if (overall >= 700) tiers.excellent.students.push(entry);
    else if (overall >= 400) tiers.good.students.push(entry);
    else if (overall >= 200) tiers.developing.students.push(entry);
    else tiers.beginner.students.push(entry);
  }

  const count = students.length;
  return {
    totalStudents: count,
    readiness: {
      excellent: { count: tiers.excellent.students.length, percentage: Math.round((tiers.excellent.students.length / count) * 100) },
      good: { count: tiers.good.students.length, percentage: Math.round((tiers.good.students.length / count) * 100) },
      developing: { count: tiers.developing.students.length, percentage: Math.round((tiers.developing.students.length / count) * 100) },
      beginner: { count: tiers.beginner.students.length, percentage: Math.round((tiers.beginner.students.length / count) * 100) },
    },
    averages: {
      development: Math.round(totalDev / count),
      problemSolving: Math.round(totalPS / count),
      knowledge: Math.round(totalKnowledge / count),
      overall: Math.round((totalDev + totalPS + totalKnowledge) / (3 * count)),
    },
  };
};

/**
 * Get department leaderboard.
 */
const getDepartmentLeaderboard = async (university, department, limit = 20) => {
  const query = { role: 'developer', 'scores.overall': { $gt: 0 } };
  if (university) query['university.name'] = new RegExp(university, 'i');
  if (department) query['university.department'] = new RegExp(department, 'i');

  return User.find(query)
    .select('name username avatar scores university isVerified')
    .sort({ 'scores.overall': -1 })
    .limit(parseInt(limit));
};

module.exports = {
  getStudentsByUniversity,
  getPlacementReadiness,
  getDepartmentLeaderboard,
};
