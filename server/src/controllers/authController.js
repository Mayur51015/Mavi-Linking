const User = require('../models/User');
const Activity = require('../models/Activity');
const { getIO } = require('../config/socket');

/**
 * @desc    Register a new user (supports user/recruiter/teacher roles)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const {
      name, email, password, role,
      // Student-specific
      university, degree, graduationYear, portfolioWebsite, githubUsername,
      preferredDomain, experienceLevel, bio,
      // Recruiter-specific
      companyName, allowedColleges, allowedDepartments,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Build user data based on role
    const userData = { name, email, password };

    // Validate and set role (default to 'user')
    const validRoles = ['user', 'recruiter', 'teacher'];
    userData.role = validRoles.includes(role) ? role : 'user';

    // Common optional fields
    if (bio) userData.bio = bio;

    // Role-specific fields
    if (userData.role === 'user') {
      if (university) userData.university = university;
      if (degree) userData.degree = degree;
      if (graduationYear) userData.graduationYear = graduationYear;
      if (portfolioWebsite) userData.portfolioWebsite = portfolioWebsite;
      if (githubUsername) userData.githubUsername = githubUsername;
      if (preferredDomain) userData.preferredDomain = preferredDomain;
      if (experienceLevel) userData.experienceLevel = experienceLevel;
    }

    if (userData.role === 'recruiter') {
      if (companyName) userData.companyName = companyName;
      if (allowedColleges) userData.allowedColleges = allowedColleges;
      if (allowedDepartments) userData.allowedDepartments = allowedDepartments;
    }

    if (userData.role === 'teacher') {
      if (university) userData.university = university;
    }

    // Create user (password is hashed via pre-save hook)
    const user = await User.create(userData);

    // Generate JWT
    const token = user.generateAuthToken();

    // Log Activity
    try {
      const roleLabels = { user: 'developer', recruiter: 'recruiter', teacher: 'teacher' };
      const activity = await Activity.create({
        userId: user._id,
        type: 'Milestone',
        title: 'Joined MaVi-Linking',
        description: `Created a new ${roleLabels[user.role] || 'developer'} profile`,
      });
      const io = getIO();
      if (io) io.to(user._id.toString()).emit('new_activity', activity);
    } catch (err) {
      console.error('Activity Error:', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user & return JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly include the password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate JWT
    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Private (requires JWT)
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the auth middleware
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile (name, avatar)
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const {
      name, avatar, username, bio, university, profileSettings, isPublic,
      degree, graduationYear, portfolioWebsite, githubUsername,
      preferredDomain, experienceLevel, companyName,
      allowedColleges, allowedDepartments,
    } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (avatar !== undefined) updateFields.avatar = avatar;
    if (username !== undefined) updateFields.username = username.toLowerCase().trim();
    if (bio !== undefined) updateFields.bio = bio;
    if (isPublic !== undefined) updateFields.isPublic = isPublic;
    if (university) {
      if (university.name !== undefined) updateFields['university.name'] = university.name;
      if (university.department !== undefined) updateFields['university.department'] = university.department;
      if (university.batch !== undefined) updateFields['university.batch'] = university.batch;
    }
    if (profileSettings) {
      if (profileSettings.theme !== undefined) updateFields['profileSettings.theme'] = profileSettings.theme;
      if (profileSettings.showEmail !== undefined) updateFields['profileSettings.showEmail'] = profileSettings.showEmail;
      if (profileSettings.resumeTemplate !== undefined) updateFields['profileSettings.resumeTemplate'] = profileSettings.resumeTemplate;
    }

    // Student-specific updates
    if (degree !== undefined) updateFields.degree = degree;
    if (graduationYear !== undefined) updateFields.graduationYear = graduationYear;
    if (portfolioWebsite !== undefined) updateFields.portfolioWebsite = portfolioWebsite;
    if (githubUsername !== undefined) updateFields.githubUsername = githubUsername;
    if (preferredDomain !== undefined) updateFields.preferredDomain = preferredDomain;
    if (experienceLevel !== undefined) updateFields.experienceLevel = experienceLevel;

    // Recruiter-specific updates
    if (companyName !== undefined) updateFields.companyName = companyName;
    if (allowedColleges !== undefined) updateFields.allowedColleges = allowedColleges;
    if (allowedDepartments !== undefined) updateFields.allowedDepartments = allowedDepartments;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    // Log Activity
    try {
      const activity = await Activity.create({
        userId: user._id,
        type: 'Other',
        title: 'Profile Updated',
        description: 'Updated profile information',
      });
      const io = getIO();
      if (io) io.to(user._id.toString()).emit('new_activity', activity);
    } catch (err) {
      console.error('Activity Error:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile };
