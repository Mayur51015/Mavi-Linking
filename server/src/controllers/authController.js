const crypto = require('crypto');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Activity = require('../models/Activity');
const ActivityLog = require('../models/ActivityLog');
const { getIO } = require('../config/socket');

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const oauth2Client = new OAuth2Client(googleClientId);

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

    // Build user data with zero-trust role security (always default role to 'user')
    const userData = { name, email, password };
    userData.role = 'user';

    const isPrivilegedRequest = ['recruiter', 'teacher'].includes(role);
    userData.requestedRole = isPrivilegedRequest ? role : 'none';
    userData.roleStatus = isPrivilegedRequest ? 'pending' : 'active';

    // Common optional fields
    if (bio) userData.bio = bio;

    // Student fields
    if (university) userData.university = university;
    if (degree) userData.degree = degree;
    if (graduationYear) userData.graduationYear = graduationYear;
    if (portfolioWebsite) userData.portfolioWebsite = portfolioWebsite;
    if (githubUsername) userData.githubUsername = githubUsername;
    if (preferredDomain) userData.preferredDomain = preferredDomain;
    if (experienceLevel) userData.experienceLevel = experienceLevel;

    // Recruiter verification details
    if (role === 'recruiter') {
      if (companyName) userData.companyName = companyName;
      if (allowedColleges) userData.allowedColleges = allowedColleges;
      if (allowedDepartments) userData.allowedDepartments = allowedDepartments;
      userData.roleVerification = {
        companyName: companyName || '',
        submittedAt: new Date(),
      };
    }

    // Teacher verification details
    if (role === 'teacher') {
      userData.roleVerification = {
        institution: university?.name || '',
        department: university?.department || '',
        submittedAt: new Date(),
      };
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
    // refreshToken is select:false — ask for it so the rotation below persists.
    const user = await User.findOne({ refreshToken: token }).select('+refreshToken');
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
    const user = await User.findOne({ verificationToken: token }).select('+verificationToken');
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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset link sent (simulated).',
      data: { resetToken },
    });
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
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: 'Reset Password',
      details: 'Password was updated successfully via reset token',
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
 * @desc    Google Sign-In / Register (Verifies Google ID Token)
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleLogin = async (req, res, next) => {
  try {
    const { token, credential, requestedRole } = req.body;
    const idToken = credential || token;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google ID token is required' });
    }

    let googlePayload = null;

    // Verify Google ID token using google-auth-library / tokeninfo verification
    try {
      if (googleClientId) {
        const ticket = await oauth2Client.verifyIdToken({
          idToken,
          audience: googleClientId,
        });
        googlePayload = ticket.getPayload();
      } else {
        const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        googlePayload = googleRes.data;
      }
    } catch (err) {
      // Fallback verification for test/dev environment or fallback tokeninfo endpoint
      try {
        const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        googlePayload = googleRes.data;
      } catch (tokeninfoErr) {
        if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
          const mockName = idToken.split('_')[0] || 'Google User';
          googlePayload = {
            sub: `google_mock_${idToken}`,
            email: `${idToken.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
            email_verified: true,
            name: mockName,
          };
        } else {
          return res.status(401).json({
            success: false,
            message: 'Google ID token verification failed. Please try signing in again.',
          });
        }
      }
    }

    if (!googlePayload || !googlePayload.email) {
      return res.status(401).json({ success: false, message: 'Invalid Google identity payload.' });
    }

    const { sub: googleId, email, name, picture } = googlePayload;
    const lowerEmail = email.toLowerCase().trim();

    let user = await User.findOne({
      $or: [{ googleId }, { email: lowerEmail }],
    });

    let isNew = false;

    if (!user) {
      user = await User.create({
        name: name || 'Google User',
        email: lowerEmail,
        googleId,
        authProvider: 'google',
        password: crypto.randomBytes(24).toString('hex'),
        avatar: picture || '',
        emailVerified: true,
        role: 'user', // Always default safely to 'user'
        requestedRole: ['teacher', 'recruiter'].includes(requestedRole) ? requestedRole : 'none',
        roleStatus: ['teacher', 'recruiter'].includes(requestedRole) ? 'pending' : 'active',
      });
      isNew = true;
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = user.authProvider || 'google';
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
      }
      user.emailVerified = true;
      await user.save();
    }

    const jwtToken = user.generateAuthToken();
    const refreshToken = crypto.randomBytes(40).toString('hex');
    user.refreshToken = refreshToken;
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: 'Google Login',
      details: isNew ? 'Created new account via Google Auth' : 'Logged in via Google Auth',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: isNew ? 'Account created via Google Sign-In' : 'Google login successful',
      data: { user, token: jwtToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request Role Upgrade (Teacher or Recruiter verification submission)
 * @route   POST /api/auth/request-role-upgrade
 * @access  Private
 */
const requestRoleUpgrade = async (req, res, next) => {
  try {
    const { requestedRole, verificationDetails } = req.body;

    if (!['teacher', 'recruiter'].includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role requested. Role must be teacher or recruiter.',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === requestedRole) {
      return res.status(400).json({
        success: false,
        message: `You are already verified as a ${requestedRole}.`,
      });
    }

    user.requestedRole = requestedRole;
    user.roleStatus = 'pending';
    user.roleVerification = {
      ...(verificationDetails || {}),
      submittedAt: new Date(),
    };

    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: 'Role Upgrade Request',
      details: `User requested upgrade to ${requestedRole} role (status: pending verification)`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: `Role upgrade request for ${requestedRole} submitted successfully. An administrator will review your verification details.`,
      data: { user },
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
      const user = await User.findById(req.user.id).select('+refreshToken');
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
  requestRoleUpgrade,
};
