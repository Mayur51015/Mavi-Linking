/**
 * MAVI Career Match Controller
 *
 * Exposes endpoints for calculating match score, listing supported roles,
 * comparing roles, and updating target career goals.
 */

const {
  getStudentCareerMatch,
  updateStudentTargetRole,
  getAllSupportedRoles,
} = require('../services/careerMatchService');

/**
 * @desc    Get career match for authenticated student (defaults to current preferredRole)
 * @route   GET /api/career-match
 * @access  Private
 */
const getCareerMatch = async (req, res, next) => {
  try {
    const roleQuery = req.query.role || null;
    const result = await getStudentCareerMatch(req.user.id, roleQuery);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get career match for a specific role
 * @route   GET /api/career-match/role/:role
 * @access  Private
 */
const getCareerMatchByRole = async (req, res, next) => {
  try {
    const { role } = req.params;
    const result = await getStudentCareerMatch(req.user.id, decodeURIComponent(role));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of all supported target roles
 * @route   GET /api/career-match/roles
 * @access  Private / Public
 */
const getSupportedRoles = async (req, res, next) => {
  try {
    const roles = getAllSupportedRoles();
    res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update target career role and recalculate match
 * @route   PUT /api/career-match/target-role
 * @access  Private
 */
const updateTargetRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || typeof role !== 'string') {
      return res.status(400).json({ success: false, message: 'Role title is required' });
    }

    const result = await updateStudentTargetRole(req.user.id, role);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCareerMatch,
  getCareerMatchByRole,
  getSupportedRoles,
  updateTargetRole,
};
