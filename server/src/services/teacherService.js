const User = require('../models/User');
const Ranking = require('../models/Ranking');
const Insight = require('../models/Insight');

/**
 * Build the base query for teacher-scoped student access.
 * Teachers see students from their own college/department,
 * PLUS students who haven't set their university yet (unaffiliated).
 * This ensures no students are invisible on the dashboard.
 */
const buildTeacherScopeQuery = (teacher) => {
  const collegeName = teacher.university?.name;
  const department = teacher.university?.department;

  // If teacher has no university set, show all students
  if (!collegeName && !department) {
    return { role: 'user' };
  }

  // Build conditions: match teacher's scope OR student has no university set
  const scopeConditions = [];

  // Condition 1: students matching the teacher's college + department
  const matchCondition = {};
  if (collegeName) {
    matchCondition['university.name'] = new RegExp(`^${collegeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  }
  if (department) {
    matchCondition['university.department'] = new RegExp(`^${department.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  }
  scopeConditions.push(matchCondition);

  // Condition 2: students who haven't filled in their university yet
  scopeConditions.push({
    $or: [
      { 'university.name': { $in: ['', null] } },
      { 'university.name': { $exists: false } },
    ],
  });

  return { role: 'user', $or: scopeConditions };
};

/**
 * Get students for a teacher (auto-scoped to their college + department).
 */
const getStudentsForTeacher = async (teacher, filters = {}) => {
  const { batch, page = 1, limit = 50, sortBy = 'scores.overall' } = filters;
  const query = buildTeacherScopeQuery(teacher);

  if (batch) query['university.batch'] = batch;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [students, total] = await Promise.all([
    User.find(query)
      .select('name username avatar scores platforms.github.username university isVerified lastSyncedAt preferredDomain experienceLevel')
      .sort({ [sortBy]: -1 })
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
    scope: {
      college: teacher.university?.name || 'Not Set',
      department: teacher.university?.department || 'Not Set',
    },
  };
};

/**
 * Get a specific student's detailed profile (within teacher's scope).
 */
const getStudentDetail = async (teacher, studentId) => {
  const query = buildTeacherScopeQuery(teacher);
  query._id = studentId;

  const student = await User.findOne(query)
    .select('-password -verificationCode');

  if (!student) {
    const err = new Error('Student not found or outside your department scope.');
    err.statusCode = 404;
    throw err;
  }

  // Fetch related data
  const [insight, ranking] = await Promise.all([
    Insight.findOne({ userId: studentId }),
    Ranking.findOne({ userId: studentId }),
  ]);

  return {
    student,
    insight,
    ranking,
  };
};

/**
 * Get placement readiness analytics for teacher's department.
 */
const getPlacementReadiness = async (teacher) => {
  const query = buildTeacherScopeQuery(teacher);
  const students = await User.find(query).select('name scores platforms');

  if (students.length === 0) {
    return { totalStudents: 0, readiness: {}, averages: {} };
  }

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
    scope: {
      college: teacher.university?.name || 'Not Set',
      department: teacher.university?.department || 'Not Set',
    },
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
 * Get department leaderboard (teacher-scoped).
 */
const getDepartmentLeaderboard = async (teacher, limit = 20) => {
  const query = buildTeacherScopeQuery(teacher);
  query['scores.overall'] = { $gt: 0 };

  return User.find(query)
    .select('name username avatar scores university isVerified preferredDomain')
    .sort({ 'scores.overall': -1 })
    .limit(parseInt(limit));
};

/**
 * Get department stats overview.
 */
const getDepartmentStats = async (teacher) => {
  const query = buildTeacherScopeQuery(teacher);

  const [totalStudents, students] = await Promise.all([
    User.countDocuments(query),
    User.find(query).select('scores preferredDomain experienceLevel platforms lastSyncedAt'),
  ]);

  if (totalStudents === 0) {
    return {
      totalStudents: 0,
      averageScore: 0,
      activeProfiles: 0,
      domainDistribution: {},
      levelDistribution: {},
      scope: {
        college: teacher.university?.name || 'Not Set',
        department: teacher.university?.department || 'Not Set',
      },
    };
  }

  let totalScore = 0;
  let activeCount = 0;
  const domainDist = {};
  const levelDist = {};

  for (const s of students) {
    totalScore += s.scores?.overall || 0;

    // Count as "active" if they have linked at least one platform
    if (s.platforms?.github?.username || s.platforms?.leetcode?.username) {
      activeCount++;
    }

    // Domain distribution
    const domain = s.preferredDomain || 'Unspecified';
    domainDist[domain] = (domainDist[domain] || 0) + 1;

    // Experience level distribution
    const level = s.experienceLevel || 'Unspecified';
    levelDist[level] = (levelDist[level] || 0) + 1;
  }

  return {
    totalStudents,
    averageScore: Math.round(totalScore / totalStudents),
    activeProfiles: activeCount,
    domainDistribution: domainDist,
    levelDistribution: levelDist,
    scope: {
      college: teacher.university?.name || 'Not Set',
      department: teacher.university?.department || 'Not Set',
    },
  };
};

module.exports = {
  getStudentsForTeacher,
  getStudentDetail,
  getPlacementReadiness,
  getDepartmentLeaderboard,
  getDepartmentStats,
};
