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

/**
 * Verification: Approve certificates, projects, skills, achievements
 */
const verifyStudentItem = async (studentId, itemType, itemId, teacherId) => {
  const student = await User.findById(studentId);
  if (!student) throw new Error('Student not found');

  if (itemType === 'projects') {
    const project = await Project.findById(itemId);
    if (!project) throw new Error('Project not found');
    project.featured = true; // Mark as verified/featured
    await project.save();
  } else if (itemType === 'certificates') {
    const cert = student.certificates.id(itemId);
    if (!cert) throw new Error('Certificate not found');
    cert.isVerified = true;
    cert.verifiedBy = teacherId;
    await student.save();
  } else if (itemType === 'achievements') {
    const ach = student.achievements.id(itemId);
    if (!ach) throw new Error('Achievement not found');
    ach.isVerified = true;
    ach.verifiedBy = teacherId;
    await student.save();
  } else if (itemType === 'skillsList') {
    const skill = student.skillsList.id(itemId);
    if (!skill) throw new Error('Skill not found');
    skill.isVerified = true;
    skill.verifiedBy = teacherId;
    await student.save();
  } else if (itemType === 'portfolioDocs') {
    const doc = student.portfolioDocs.id(itemId);
    if (!doc) throw new Error('Document not found');
    doc.isVerified = true;
    doc.verifiedBy = teacherId;
    await student.save();
  } else if (itemType === 'platforms') {
    student.isVerified = true;
    await student.save();
  } else {
    throw new Error('Invalid item type for verification');
  }

  // Check if student has verified items and flag student profile as verified
  const hasVerifiedProject = await Project.exists({ user: studentId, featured: true });
  const hasVerifiedCert = student.certificates.some(c => c.isVerified);
  if (hasVerifiedProject || hasVerifiedCert) {
    student.isVerified = true;
    await student.save();
  }

  // Create notification for student
  const { createNotification } = require('./notificationService');
  await createNotification({
    recipientId: studentId,
    senderId: teacherId,
    type: 'general',
    title: 'Verification Approved',
    message: `Your ${itemType} item has been verified by your instructor.`,
  });

  return { success: true };
};

/**
 * Recommend student to a recruiter
 */
const recommendStudent = async (studentId, recruiterId, teacherId) => {
  const student = await User.findById(studentId);
  const recruiter = await User.findById(recruiterId);
  const teacher = await User.findById(teacherId);

  if (!student || !recruiter) throw new Error('Student or Recruiter not found');

  const { createNotification } = require('./notificationService');
  await createNotification({
    recipientId: recruiterId,
    senderId: teacherId,
    type: 'general',
    title: 'Teacher Recommendation',
    message: `${teacher.name} has recommended candidate ${student.name} (${student.preferredDomain || 'Software Developer'}) for recruitment.`,
    metadata: { studentId: student._id },
  });

  return { success: true };
};

/**
 * Batch comparison analytics
 */
const getBatchAnalytics = async (teacher) => {
  const query = buildTeacherScopeQuery(teacher);
  const students = await User.find(query).select('scores university placementStatus placementCTC');

  const batches = ['2024', '2025', '2026'];
  const analytics = {};

  batches.forEach(b => {
    analytics[b] = {
      total: 0,
      placed: 0,
      avgScore: 0,
      highestPackage: 0,
      totalScore: 0,
    };
  });

  students.forEach(s => {
    const b = s.university?.batch || s.graduationYear || '2025';
    if (analytics[b]) {
      analytics[b].total += 1;
      if (['Placed', 'Joined', 'Placed / Hired', 'Offer Accepted'].includes(s.placementStatus)) {
        analytics[b].placed += 1;
      }
      analytics[b].totalScore += (s.scores?.overall || 0);

      // CTC extraction
      const ctcStr = s.placementCTC || '';
      const ctcNum = parseFloat(ctcStr.replace(/[^0-9.]/g, ''));
      if (!isNaN(ctcNum) && ctcNum > analytics[b].highestPackage) {
        analytics[b].highestPackage = ctcNum;
      }
    }
  });

  batches.forEach(b => {
    if (analytics[b].total > 0) {
      analytics[b].avgScore = Math.round(analytics[b].totalScore / analytics[b].total);
      analytics[b].placementRate = Math.round((analytics[b].placed / analytics[b].total) * 100);
    } else {
      analytics[b].placementRate = 0;
    }
  });

  return analytics;
};

/**
 * Generate PDF report inside memory stream
 */
const generatePdfReport = async (teacher, type) => {
  const query = buildTeacherScopeQuery(teacher);
  const students = await User.find(query).select('name email scores university placementStatus placementCTC');

  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ margin: 50 });

  // design styling
  doc.fontSize(22)
     .font('Helvetica-Bold')
     .text('MAVI LINKING — CAMPUS PLACEMENT REPORT', 50, 50);

  doc.fontSize(10)
     .fillColor('#71717a')
     .text(`Generated By: ${teacher.name} | Date: ${new Date().toLocaleDateString()}`, 50, 80);

  doc.moveTo(50, 100).lineTo(550, 100).strokeColor('#8b5cf6').stroke();

  doc.fontSize(14)
     .fillColor('#000000')
     .text(`Report Type: ${type.toUpperCase()}`, 50, 120);

  let y = 160;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#8b5cf6');
  doc.text('Student Name', 50, y);
  doc.text('Batch', 200, y);
  doc.text('Score', 280, y);
  doc.text('Status', 350, y);
  doc.text('Package', 480, y);

  doc.moveTo(50, y + 15).lineTo(550, y + 15).strokeColor('#a1a1aa').stroke();
  y += 25;

  doc.font('Helvetica').fillColor('#27272a');
  students.forEach((s, idx) => {
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 50;
    }
    doc.text(s.name, 50, y);
    doc.text(s.university?.batch || 'N/A', 200, y);
    doc.text((s.scores?.overall || 0).toString(), 280, y);
    doc.text(s.placementStatus || 'Available', 350, y);
    doc.text(s.placementCTC || 'N/A', 480, y);
    y += 20;
  });

  doc.end();
  return doc;
};

/**
 * Get mentoring alerts for students needing attention
 */
const getMentoringAlerts = async (teacher) => {
  const scopeQuery = buildTeacherScopeQuery(teacher);
  
  const query = {
    $and: [
      scopeQuery,
      {
        $or: [
          { placementReadinessScore: { $lt: 50 } },
          { 'scores.overall': { $lt: 400 } }
        ]
      }
    ]
  };

  return User.find(query)
    .select('name username avatar scores placementReadinessScore aiAnalysis preferredDomain')
    .sort({ placementReadinessScore: 1 })
    .limit(20);
};

module.exports = {
  getStudentsForTeacher,
  getStudentDetail,
  getPlacementReadiness,
  getDepartmentLeaderboard,
  getDepartmentStats,
  verifyStudentItem,
  recommendStudent,
  getBatchAnalytics,
  generatePdfReport,
  getMentoringAlerts,
};
