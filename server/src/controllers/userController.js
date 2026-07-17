const User = require('../models/User');

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

module.exports = { getUsersByRole, getUserById };
