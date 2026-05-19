const teacherService = require('../services/teacherService');

/**
 * @desc    Get students from teacher's own college + department
 * @route   GET /api/teacher/students
 * @access  Private (teacher)
 */
const getMyStudents = async (req, res, next) => {
  try {
    const { batch, page, limit, sortBy } = req.query;
    const result = await teacherService.getStudentsForTeacher(req.user, {
      batch, page, limit, sortBy,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed student profile (within teacher's scope)
 * @route   GET /api/teacher/students/:studentId
 * @access  Private (teacher)
 */
const getStudentDetail = async (req, res, next) => {
  try {
    const student = await teacherService.getStudentDetail(req.user, req.params.studentId);
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get placement readiness for teacher's department
 * @route   GET /api/teacher/readiness
 * @access  Private (teacher)
 */
const getReadiness = async (req, res, next) => {
  try {
    const result = await teacherService.getPlacementReadiness(req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get department leaderboard
 * @route   GET /api/teacher/leaderboard
 * @access  Private (teacher)
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const leaderboard = await teacherService.getDepartmentLeaderboard(req.user, limit);
    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get department stats overview
 * @route   GET /api/teacher/stats
 * @access  Private (teacher)
 */
const getDepartmentStats = async (req, res, next) => {
  try {
    const stats = await teacherService.getDepartmentStats(req.user);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyStudents,
  getStudentDetail,
  getReadiness,
  getLeaderboard,
  getDepartmentStats,
};
