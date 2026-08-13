const User = require('../models/User');
const { generateRecruiterReport, writeRecruiterReportPdf } = require('../services/recruiterReportService');

/**
 * @desc Get list of users filtered by role
 * @route GET /api/users
 * @access Private
 */
const getUsersByRole = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) {
      filter.role = role;
    }
    const users = await User.find(filter).select('name username avatar role companyName');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get authenticated user's own AI report PDF
 * @route GET /api/users/me/report
 * @access Private
 */
const getMyReport = async (req, res, next) => {
  try {
    const report = await generateRecruiterReport(req.user.id, req.user);
    await writeRecruiterReportPdf(report, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get user info by ID
 * @route GET /api/users/:id
 * @access Private
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('name username avatar role companyName');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsersByRole, getUserById, getMyReport };
