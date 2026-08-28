const User = require('../models/User');
const Department = require('../models/Department');
const Project = require('../models/Project');
const TeacherAnnouncement = require('../models/TeacherAnnouncement');
const AuditLog = require('../models/AuditLog');
const { PRIVILEGED_ROLES, calculateScoreTier, calculateMedal } = require('../utils/leaderboardHelper');
const { generateDepartmentReportData, writeDepartmentReportPdf } = require('../services/departmentReportService');

/**
 * Build department & institution scope query from request object
 */
const buildScopeQuery = (req, baseRoleQuery = {}) => {
  const query = { ...baseRoleQuery };

  if (req.departmentScope?.departmentId) {
    query.departmentId = req.departmentScope.departmentId;
  } else if (req.user?.departmentId) {
    query.departmentId = req.user.departmentId;
  }

  if (req.departmentScope?.institutionId) {
    query.institutionId = req.departmentScope.institutionId;
  } else if (req.user?.institutionId) {
    query.institutionId = req.user.institutionId;
  }

  return query;
};

/**
 * @desc    Get department-scoped dashboard metrics for logged-in Department Admin
 * @route   GET /api/department-admin/dashboard
 * @access  Private (Department Admin, Institution Admin, Super Admin)
 */
const getDepartmentDashboard = async (req, res, next) => {
  try {
    const departmentId = req.departmentScope?.departmentId || req.user.departmentId;
    const institutionId = req.departmentScope?.institutionId || req.user.institutionId;

    const department = departmentId
      ? await Department.findById(departmentId).populate('institutionId', 'name code tenantId')
      : null;

    const deptQuery = buildScopeQuery(req);
    const studentQuery = { ...deptQuery, role: { $in: ['user', 'student', 'developer'] } };
    const teacherQuery = { ...deptQuery, role: { $in: ['teacher', 'professor'] } };

    const [
      studentsCount,
      teachersCount,
      activeStudentsCount,
      activeTeachersCount,
      announcements,
      deptStudents,
    ] = await Promise.all([
      User.countDocuments(studentQuery),
      User.countDocuments(teacherQuery),
      User.countDocuments({ ...studentQuery, status: 'active' }),
      User.countDocuments({ ...teacherQuery, status: 'active' }),
      TeacherAnnouncement.find(deptQuery).sort({ createdAt: -1 }).limit(5),
      User.find(studentQuery).select('_id scores platforms skillsList placementStatus'),
    ]);

    // Calculate real aggregated scores from DB
    let totalScore = 0;
    let totalDev = 0;
    let totalProblem = 0;
    let ghCount = 0;
    let lcCount = 0;
    let placedCount = 0;
    const studentIds = deptStudents.map((s) => s._id);

    deptStudents.forEach((student) => {
      totalScore += student.scores?.overall || 0;
      totalDev += student.scores?.development || 0;
      totalProblem += student.scores?.problemSolving || 0;
      if (student.platforms?.github?.username) ghCount++;
      if (student.platforms?.leetcode?.username) lcCount++;
      if (student.placementStatus === 'Placed' || student.placementStatus === 'Hired') placedCount++;
    });

    const studentTotal = deptStudents.length || 1;
    const projectsCount = await Project.countDocuments({ user: { $in: studentIds } });

    res.status(200).json({
      success: true,
      data: {
        departmentName: department?.name || req.user.university?.department || 'Department Administration',
        departmentCode: department?.code || '',
        institutionName: department?.institutionId?.name || req.user.university?.name || '',
        tenantId: req.user.tenantId,
        metrics: {
          students: studentsCount,
          teachers: teachersCount,
          activeStudents: activeStudentsCount,
          activeTeachers: activeTeachersCount,
          announcementsCount: announcements.length,
          avgMaviScore: Math.round(totalScore / studentTotal),
          avgDevScore: Math.round(totalDev / studentTotal),
          avgProblemSolvingScore: Math.round(totalProblem / studentTotal),
          githubConnections: ghCount,
          leetcodeConnections: lcCount,
          projectsCount,
          placementReadiness: {
            placed: placedCount,
            available: Math.max(0, studentsCount - placedCount),
          },
        },
        announcements,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated student directory strictly for assigned department
 * @route   GET /api/department-admin/students
 * @access  Private (Department Admin)
 */
const getDepartmentStudents = async (req, res, next) => {
  try {
    const { search, year, branch, status, page = 1, limit = 20 } = req.query;
    const query = buildScopeQuery(req, { role: { $in: ['user', 'student', 'developer'] } });

    if (status) query.status = status;
    if (year) query['academicInfo.year'] = year;
    if (branch) query['academicInfo.branch'] = branch;

    if (search) {
      const clean = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: clean, $options: 'i' } },
        { email: { $regex: clean, $options: 'i' } },
        { maviId: { $regex: clean, $options: 'i' } },
        { prn: { $regex: clean, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [students, total] = await Promise.all([
      User.find(query)
        .select('name email maviId prn avatar university scores status accountStatus skillsList platforms createdAt academicInfo')
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        students,
        pagination: {
          total,
          page: parseInt(page, 10),
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student detail view strictly within department scope
 * @route   GET /api/department-admin/students/:studentId
 * @access  Private (Department Admin)
 */
const getDepartmentStudentById = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await User.findById(studentId).select('-password');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Verify Department Scoping
    if (req.departmentScope?.departmentId) {
      if (!student.departmentId || student.departmentId.toString() !== req.departmentScope.departmentId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. You can only view student profiles within your assigned department.',
        });
      }
    }

    const projects = await Project.find({ user: student._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        student,
        projects,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update permitted student profile fields within department scope
 * @route   PATCH /api/department-admin/students/:studentId/profile
 * @access  Private (Department Admin)
 */
const updateDepartmentStudentProfile = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Tenant / Department Isolation Guard
    if (req.departmentScope?.departmentId) {
      if (!student.departmentId || student.departmentId.toString() !== req.departmentScope.departmentId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. You can only manage students within your assigned department.',
        });
      }
    }

    const changedFields = [];

    // Updatable fields by Department Admin
    if (req.body.name) {
      student.name = req.body.name.trim();
      changedFields.push('name');
    }
    if (req.body.phone !== undefined) {
      student.phone = req.body.phone.trim();
      changedFields.push('phone');
    }
    if (req.body.bio !== undefined) {
      student.bio = req.body.bio;
      changedFields.push('bio');
    }
    if (req.body.prn !== undefined && req.body.prn.trim() !== (student.prn || '')) {
      student.prn = req.body.prn.trim();
      changedFields.push('prn');
    }
    if (Array.isArray(req.body.skills)) {
      student.skillsList = req.body.skills.map((s) =>
        typeof s === 'string' ? { name: s, isVerified: true, verifiedBy: req.user._id } : s
      );
      changedFields.push('skills');
    }
    if (req.body.github !== undefined) {
      if (!student.platforms) student.platforms = {};
      if (!student.platforms.github) student.platforms.github = {};
      student.platforms.github.username = req.body.github.trim();
      changedFields.push('github');
    }
    if (req.body.linkedin !== undefined) {
      student.linkedinUrl = req.body.linkedin.trim();
      changedFields.push('linkedin');
    }

    if (changedFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid profile updates provided.' });
    }

    await student.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      targetUserId: student._id,
      institutionId: student.institutionId,
      departmentId: student.departmentId,
      tenantId: student.tenantId || '',
      action: 'STUDENT_PROFILE_UPDATED',
      changedFields,
      result: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: 'Student profile updated successfully',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get teacher list strictly for assigned department
 * @route   GET /api/department-admin/teachers
 * @access  Private (Department Admin)
 */
const getDepartmentTeachers = async (req, res, next) => {
  try {
    const query = buildScopeQuery(req, { role: { $in: ['teacher', 'professor'] } });

    const teachers = await User.find(query)
      .select('name email maviId designation status avatar createdAt departmentId institutionId')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get department-scoped analytics & performance metrics
 * @route   GET /api/department-admin/analytics
 * @access  Private (Department Admin)
 */
const getDepartmentAnalytics = async (req, res, next) => {
  try {
    const query = buildScopeQuery(req, { role: { $in: ['user', 'student', 'developer'] } });
    const students = await User.find(query).select('scores skillsList platforms status academicInfo');

    const totalStudents = students.length || 1;
    const tierDistribution = { Beginner: 0, Developing: 0, Intermediate: 0, Advanced: 0, Expert: 0, Exceptional: 0 };
    const skillCounts = {};
    let totalScore = 0;
    let totalDev = 0;
    let totalProblem = 0;

    students.forEach((s) => {
      const overall = s.scores?.overall || 0;
      totalScore += overall;
      totalDev += s.scores?.development || 0;
      totalProblem += s.scores?.problemSolving || 0;

      const tier = calculateScoreTier(overall);
      tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;

      (s.skillsList || []).forEach((sk) => {
        const skillName = typeof sk === 'string' ? sk : sk.name;
        if (skillName) {
          skillCounts[skillName] = (skillCounts[skillName] || 0) + 1;
        }
      });
    });

    const topSkills = Object.entries(skillCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        totalStudents: students.length,
        averages: {
          overallScore: Math.round(totalScore / totalStudents),
          developmentScore: Math.round(totalDev / totalStudents),
          problemSolvingScore: Math.round(totalProblem / totalStudents),
        },
        tierDistribution,
        topSkills,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate department-scoped report data
 * @route   GET /api/department-admin/reports
 * @access  Private (Department Admin)
 */
const getDepartmentReports = async (req, res, next) => {
  try {
    const reportData = await generateDepartmentReportData(req);

    res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export department-scoped performance report as PDF
 * @route   GET /api/department-admin/reports/pdf
 * @access  Private (Department Admin)
 */
const exportDepartmentReportPdf = async (req, res, next) => {
  try {
    const reportData = await generateDepartmentReportData(req);
    await writeDepartmentReportPdf(reportData, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get department student leaderboard (excluding privileged accounts)
 * @route   GET /api/department-admin/leaderboard
 * @access  Private (Department Admin)
 */
const getDepartmentLeaderboard = async (req, res, next) => {
  try {
    const query = buildScopeQuery(req, {
      role: { $nin: PRIVILEGED_ROLES },
      status: { $ne: 'suspended' },
    });

    const students = await User.find(query)
      .select('name avatar maviId scores role status platforms')
      .sort({
        'scores.overall': -1,
        'scores.problemSolving': -1,
        'scores.development': -1,
        maviId: 1,
      });

    const leaderboard = students.map((std, index) => {
      const rank = index + 1;
      const score = std.scores?.overall || 0;
      return {
        _id: std._id,
        rank,
        score,
        medal: calculateMedal(rank),
        scoreTier: calculateScoreTier(score),
        scores: std.scores,
        user: {
          _id: std._id,
          name: std.name,
          avatar: std.avatar,
          maviId: std.maviId,
          role: std.role,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: {
        leaderboard,
        total: leaderboard.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartmentDashboard,
  getDepartmentStudents,
  getDepartmentStudentById,
  updateDepartmentStudentProfile,
  getDepartmentTeachers,
  getDepartmentAnalytics,
  getDepartmentReports,
  exportDepartmentReportPdf,
  getDepartmentLeaderboard,
};
