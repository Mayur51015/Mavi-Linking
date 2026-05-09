const educationService = require('../services/educationService');

/**
 * @desc    Get students by university/department
 * @route   GET /api/education/students
 * @access  Private (professor)
 */
const getStudents = async (req, res, next) => {
  try {
    const { university, department, batch, page, limit } = req.query;
    const result = await educationService.getStudentsByUniversity({
      university, department, batch, page, limit,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get placement readiness analytics
 * @route   GET /api/education/readiness
 * @access  Private (professor)
 */
const getReadiness = async (req, res, next) => {
  try {
    const { university, department } = req.query;
    const result = await educationService.getPlacementReadiness(university, department);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get department leaderboard
 * @route   GET /api/education/leaderboard
 * @access  Private (professor)
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const { university, department, limit } = req.query;
    const leaderboard = await educationService.getDepartmentLeaderboard(university, department, limit);
    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getReadiness,
  getLeaderboard,
};
