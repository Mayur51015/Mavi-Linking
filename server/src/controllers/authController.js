const crypto = require('crypto');
const User = require('../models/User');
const Activity = require('../models/Activity');
const ActivityLog = require('../models/ActivityLog');
const { getIO } = require('../config/socket');
const { hashToken, createHashedToken } = require('../utils/tokenUtils');

// Reset tokens are valid for one hour from issue.
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// Email delivery is not wired up yet, so in development the reset token is
// echoed back to make the flow testable. In production it must never leave the
// server — returning it there turns forgot-password into a takeover endpoint.
const shouldExposeResetToken = () => process.env.NODE_ENV !== 'production';

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
    if (userData.role === 'user' || userData.role === 'teacher') {
      if (university) userData.university = university;
    }

    if (userData.role === 'user') {
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

    // Generate verification token and refresh token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(40).toString('hex');

    userData.verificationToken = verificationToken;
    userData.refreshToken = refreshToken;
    userData.emailVerified = false;

    // Create user (password is hashed via pre-save hook)
    const user = await User.create(userData);

    // Generate JWT
    const token = user.generateAuthToken();

    // Log Activity Feed
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

    // Log Security Audit Activity
    try {
      await ActivityLog.create({
        userId: user._id,
        action: 'Register',
        details: `Registered new account as ${user.role}. Verification token generated.`,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });
    } catch (auditErr) {
      console.error('Audit Log Error:', auditErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify your email.',
      data: {
        user,
        token,
        refreshToken,
        verificationToken, // return for easy dev/test flow
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

    // Generate JWT and Refresh Token
    const token = user.generateAuthToken();
    const refreshToken = crypto.randomBytes(40).toString('hex');
    user.refreshToken = refreshToken;
    await user.save();

    // Log Security Audit Activity
    try {
      await ActivityLog.create({
        userId: user._id,
        action: 'Login',
        details: 'Logged in successfully',
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });
    } catch (auditErr) {
      console.error('Audit Log Error:', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
        refreshToken,
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
      allowedColleges, allowedDepartments, documents,
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
    if (documents) {
      if (documents.resume !== undefined) updateFields['documents.resume'] = documents.resume;
      if (documents.aadhaar !== undefined) updateFields['documents.aadhaar'] = documents.aadhaar;
      if (documents.pan !== undefined) updateFields['documents.pan'] = documents.pan;
      if (documents.marksheet !== undefined) updateFields['documents.marksheet'] = documents.marksheet;
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

    // Log Activity & Timeline Event
    try {
      const { logTimelineEvent } = require('../utils/timelineLogger');
      await logTimelineEvent(
        user._id,
        'ACCOUNT',
        'Profile Updated',
        'Updated profile information'
      );

      const activity = await Activity.create({
        userId: user._id,
        type: 'Other',
        title: 'Profile Updated',
        description: 'Updated profile information',
      });
      const io = getIO();
      if (io) io.to(user._id.toString()).emit('new_activity', activity);
    } catch (err) {
      console.error('Activity/Timeline Error:', err.message);
    }

    // Re-evaluate intelligence
    let updatedUser = user;
    try {
      const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');
      const recalculated = await evaluateUserIntelligence(user._id);
      if (recalculated) updatedUser = recalculated;
    } catch (err) {
      console.error('Intelligence Re-eval Error:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }
    const user = await User.findOne({ refreshToken: token });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const newAccessToken = user.generateAuthToken();
    const newRefreshToken = crypto.randomBytes(40).toString('hex');

    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify email address using token
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    user.emailVerified = true;
    user.verificationToken = null;
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: 'Verify Email',
      details: 'Email successfully verified',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request password reset link
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Same wording and status code whether or not the account exists, so this
    // endpoint can't be used to enumerate registered addresses. This matches
    // how the login handler already treats unknown emails.
    const genericResponse = {
      success: true,
      message: 'If an account exists for that email, a password reset link has been sent.',
    };

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Only the digest is persisted; the raw token exists solely in the reply.
    const { rawToken, hashedToken } = createHashedToken();
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + RESET_TOKEN_TTL_MS;
    await user.save();

    const payload = { ...genericResponse };
    if (shouldExposeResetToken()) {
      payload.data = { resetToken: rawToken };
      payload.devNote =
        'resetToken is returned because NODE_ENV is not "production". It is omitted in production builds.';
    }

    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Both a reset token and a new password are required',
      });
    }

    // The database stores the digest, so hash the incoming token to look it up.
    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    // Evict every existing session. Without this, an attacker who already has
    // a refresh token or an unexpired JWT keeps their access after the victim
    // resets — which is usually the exact reason the reset was triggered.
    user.refreshToken = null;
    user.passwordChangedAt = new Date();

    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: 'Reset Password',
      details: 'Password was updated successfully via reset token. All active sessions were revoked.',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mock Google Login/Register
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleLogin = async (req, res, next) => {
  try {
    const { token, role = 'user' } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'ID token is required' });
    }
    const mockEmail = `${token.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
    const mockName = token.split('_')[0] || 'Google User';

    let user = await User.findOne({ email: mockEmail });
    let isNew = false;
    if (!user) {
      user = await User.create({
        name: mockName,
        email: mockEmail,
        password: crypto.randomBytes(16).toString('hex'),
        role: role,
        emailVerified: true,
      });
      isNew = true;
    }

    const jwtToken = user.generateAuthToken();
    const refreshToken = crypto.randomBytes(40).toString('hex');
    user.refreshToken = refreshToken;
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: 'Google Login',
      details: isNew ? 'Created account via Google Auth' : 'Logged in via Google Auth',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      data: { user, token: jwtToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mock GitHub Login/Register
 * @route   POST /api/auth/github
 * @access  Public
 */
const githubLogin = async (req, res, next) => {
  try {
    const { code, role = 'user' } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Auth code is required' });
    }
    const mockUsername = code.toLowerCase().trim();
    const mockEmail = `${mockUsername}@github.com`;
    const mockName = code.charAt(0).toUpperCase() + code.slice(1);

    let user = await User.findOne({ email: mockEmail });
    let isNew = false;
    if (!user) {
      user = await User.create({
        name: mockName,
        email: mockEmail,
        password: crypto.randomBytes(16).toString('hex'),
        role: role,
        githubUsername: mockUsername,
        platforms: { github: { username: mockUsername, linkedAt: new Date() } },
        emailVerified: true,
      });
      isNew = true;
    }

    const jwtToken = user.generateAuthToken();
    const refreshToken = crypto.randomBytes(40).toString('hex');
    user.refreshToken = refreshToken;
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: 'GitHub Login',
      details: isNew ? 'Created account via GitHub Auth' : 'Logged in via GitHub Auth',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      data: { user, token: jwtToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user & clear session tokens
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.refreshToken = null;
        await user.save();

        await ActivityLog.create({
          userId: user._id,
          action: 'Logout',
          details: 'Logged out successfully',
          ipAddress: req.ip || '',
          userAgent: req.headers['user-agent'] || '',
        });
      }
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  googleLogin,
  githubLogin,
  logout,
};
