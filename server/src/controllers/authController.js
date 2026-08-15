const crypto = require('crypto');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Activity = require('../models/Activity');
const ActivityLog = require('../models/ActivityLog');
const AuditLog = require('../models/AuditLog');
const EmailChangeChallenge = require('../models/EmailChangeChallenge');
const { sendEmail, generateEmailChangeOtpEmailHtml, generateEmailChangeNotificationOldEmailHtml } = require('../utils/sendEmail');
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
      prn, facultyId, institutionId,
      // Student-specific
      university, degree, graduationYear, portfolioWebsite, githubUsername,
      preferredDomain, experienceLevel, bio,
      // Recruiter-specific
      companyName, allowedColleges, allowedDepartments,
    } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    const lowerEmail = email.toLowerCase().trim();

    // Check if user already exists with this email
    const existingUser = await User.findOne({ email: lowerEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        code: 'ACCOUNT_EXISTS',
        message: 'An account with this email address already exists. Please sign in instead.',
      });
    }

    const Institution = require('../models/Institution');
    let targetInst = null;
    if (institutionId) {
      targetInst = await Institution.findById(institutionId);
      if (!targetInst) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or non-existent institution selected.',
        });
      }
    }

    // Institution-scoped PRN duplicate check
    if (prn && (institutionId || targetInst?._id)) {
      const targetInstId = institutionId || targetInst._id;
      const existingPrn = await User.findOne({ institutionId: targetInstId, prn: prn.trim() });
      if (existingPrn) {
        return res.status(409).json({
          success: false,
          code: 'PRN_EXISTS',
          message: 'A student with this PRN/ZPRN is already registered for this institution.',
        });
      }
    }

    // Zero-Trust Public Registration Policy:
    // Teachers, Recruiters, and Admins CANNOT self-register through public signup.
    const forbiddenPublicRoles = ['teacher', 'recruiter', 'admin', 'institution_admin', 'super_admin', 'platform_owner', 'owner'];
    if (role && forbiddenPublicRoles.includes(role.toLowerCase())) {
      return res.status(403).json({
        success: false,
        code: 'PUBLIC_REGISTRATION_FORBIDDEN',
        message: 'Self-registration for Teacher and Recruiter roles is not permitted. Teacher and Recruiter accounts must be provisioned by an authorized administrator.',
      });
    }

    // Build user data with zero-trust role security (always default role to 'user' / Student)
    const userData = { name, email: lowerEmail, password };
    userData.role = 'user';
    userData.roles = ['user'];
    userData.requestedRole = 'none';
    userData.roleStatus = 'active';
    userData.accountStatus = 'ACTIVE';

    // Institutional identifiers & verification status
    if (prn) {
      userData.prn = prn.trim();
      userData.institutionalIdentifier = {
        identifierType: 'PRN',
        identifierValue: prn.trim(),
      };
    }
    if (institutionId) {
      userData.institutionId = institutionId;
      if (targetInst?.tenantId) userData.tenantId = targetInst.tenantId;
    }
    userData.prnVerificationStatus = 'pending';

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
        details: `Registered new account as ${user.role}. PRN Verification status: pending.`,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });
    } catch (auditErr) {
      console.error('Audit Log Error:', auditErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Institutional identity pending verification.',
      data: {
        user,
        token,
        refreshToken,
        verificationToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user & return JWT (Supports MAVI ID, Verified PRN/Faculty ID, or Email)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const rawIdentifier = (req.body.email || req.body.identifier || req.body.maviId || req.body.prn || '').toString().trim();
    const { password } = req.body;

    if (!rawIdentifier || !password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid identifier or password',
      });
    }

    let user = null;
    let isPrnAttempt = false;

    // 1. MAVI ID format (e.g. MAVI-8F3K7Q2P)
    if (rawIdentifier.toUpperCase().startsWith('MAVI-')) {
      user = await User.findOne({ maviId: rawIdentifier.toUpperCase() }).select('+password');
    }
    // 2. Admin ID format (e.g. ZEAL-ADMIN-001, INSTADM-XXXXXX)
    else if (rawIdentifier.toUpperCase().startsWith('ZEAL-') || rawIdentifier.toUpperCase().startsWith('INSTADM-') || rawIdentifier.toUpperCase().includes('-ADMIN-')) {
      user = await User.findOne({
        $or: [
          { adminId: rawIdentifier.toUpperCase() },
          { adminLoginId: rawIdentifier.toUpperCase() },
        ],
      }).select('+password');
    }
    // 3. Email address format
    else if (rawIdentifier.includes('@')) {
      user = await User.findOne({ email: rawIdentifier.toLowerCase() }).select('+password');
    }
    // 4. PRN / ZPRN / Faculty ID format
    else {
      isPrnAttempt = true;
      const escapedIdentifier = rawIdentifier.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      // Search for user by PRN or Faculty ID (case-insensitive)
      const candidateUser = await User.findOne({
        $or: [
          { prn: { $regex: `^${escapedIdentifier}$`, $options: 'i' } },
          { facultyId: { $regex: `^${escapedIdentifier}$`, $options: 'i' } },
        ],
      }).select('+password');

      if (candidateUser) {
        // Disallow PRN login for administrative accounts
        const adminRoles = ['institution_admin', 'super_admin', 'platform_owner', 'owner', 'admin'];
        if (adminRoles.includes(candidateUser.role)) {
          return res.status(403).json({
            success: false,
            message: 'Administrative accounts must log in using their Admin ID or official email.',
          });
        }

        // Verify PRN approval status
        if (candidateUser.prnVerificationStatus !== 'approved') {
          return res.status(403).json({
            success: false,
            code: 'PRN_PENDING_APPROVAL',
            message: 'Your PRN/ZPRN identity is pending institution verification. Please sign in using your MAVI ID or email.',
          });
        }

        user = candidateUser;
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid MAVI ID/PRN or password.',
      });
    }

    // Check account status
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account suspended. Please contact platform administration.',
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid identifier or password',
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
        details: `Logged in successfully via ${rawIdentifier.toUpperCase().startsWith('MAVI-') ? 'MAVI ID' : rawIdentifier.includes('@') ? 'Email' : 'PRN/Faculty ID'}`,
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
    if (user && !user.maviId) {
      user.maviId = 'MAVI-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      await user.save();
    }

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
      allowedColleges, allowedDepartments, documents, phone, headline, skills,
    } = req.body;
    const updateFields = {};

    if (name && name.trim()) updateFields.name = name.trim();
    if (avatar !== undefined && avatar !== null) updateFields.avatar = avatar;
    if (username && username.trim().length >= 3 && /^[a-z0-9_-]{3,30}$/i.test(username.trim())) {
      updateFields.username = username.toLowerCase().trim();
    }
    if (bio !== undefined) updateFields.bio = bio;
    if (phone !== undefined) updateFields.phone = phone;
    if (headline !== undefined) updateFields.headline = headline;
    if (skills !== undefined) updateFields.skills = Array.isArray(skills) ? skills : [];
    if (isPublic !== undefined) updateFields.isPublic = isPublic;

    if (university) {
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
    ).populate('institutionId', 'name tenantId shortName domain');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Log Activity & Timeline Event
    try {
      const { logTimelineEvent } = require('../utils/timelineLogger');
      await logTimelineEvent(
        user._id,
        'ACCOUNT',
        'Profile Updated',
        'Updated profile information'
      );

      // Deduplicate repetitive profile update activities within 15 minutes
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      const recentActivity = await Activity.findOne({
        userId: user._id,
        title: 'Profile Updated',
        date: { $gte: fifteenMinsAgo },
      });

      if (!recentActivity) {
        const activity = await Activity.create({
          userId: user._id,
          type: 'Profile',
          title: 'Profile Updated',
          description: 'Updated profile information',
        });
        const io = getIO();
        if (io) io.to(user._id.toString()).emit('new_activity', activity);
      }
    } catch (err) {
      console.error('Activity/Timeline Error:', err.message);
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
 * @desc    Request password reset via verified email / recovery channel (OTP or Link)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email, phone, maviId, prn } = req.body;

    // Block recovery requests using only semi-public identifiers (MAVI ID or PRN)
    if ((maviId || prn) && !email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Account recovery requires a verified email address or registered phone number. Account recovery using MAVI ID or PRN alone is not permitted.',
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a verified recovery email address or phone number.',
      });
    }

    // Lookup user by verified recovery channel
    const query = {};
    if (email) query.email = email.toLowerCase().trim();
    else if (phone) query.phone = phone.trim();

    const user = await User.findOne(query);

    // Generic response to prevent account enumeration
    const genericSuccessMsg = 'If an account matching that verified recovery channel exists, a password reset link and OTP have been dispatched to your recovery channel.';

    if (!user) {
      return res.status(200).json({
        success: true,
        message: genericSuccessMsg,
      });
    }

    // Generate cryptographic reset token (for link) & 6-digit OTP (for OTP input)
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const rawOtp = String(crypto.randomInt(100000, 999999));

    // Hash tokens before storing in database
    const hashedToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordOtp = hashedOtp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Log recovery request event
    try {
      await ActivityLog.create({
        userId: user._id,
        action: 'PASSWORD_RECOVERY_REQUESTED',
        details: `Password recovery token/OTP generated for recovery channel ${user.email}`,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });
    } catch (err) {
      console.error('Failed to log recovery activity:', err.message);
    }

    // Log securely to server console for simulation/testing
    console.log(`[RECOVERY DISPATCH] Email: ${user.email} | OTP: ${rawOtp} | Token: ${rawResetToken}`);

    // Send Real Email via Nodemailer Service
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password?token=${rawResetToken}`;

    const { sendEmail, generatePasswordResetEmailHtml } = require('../utils/sendEmail');
    const emailHtml = generatePasswordResetEmailHtml({
      name: user.name,
      otp: rawOtp,
      resetLink,
    });

    // Asynchronously dispatch email so HTTP response remains snappy
    sendEmail({
      to: user.email,
      subject: 'MAVI Linking — Password Reset Request & Security OTP',
      html: emailHtml,
    }).catch(emailErr => {
      console.error('[EMAIL ERROR] Failed to dispatch password reset email:', emailErr);
    });

    res.status(200).json({
      success: true,
      message: genericSuccessMsg,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using verified recovery token OR 6-digit OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, otp, email, phone, password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'New password is required' });
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (password.length < 6 || !passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters and contain at least one uppercase letter, one lowercase letter, and one number',
      });
    }

    let user = null;

    if (token) {
      // Recovery via Link Token
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      }).select('+resetPasswordToken +resetPasswordOtp +resetPasswordExpires +refreshToken');
    } else if (otp && (email || phone)) {
      // Recovery via Verified OTP
      const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
      const query = {
        resetPasswordOtp: hashedOtp,
        resetPasswordExpires: { $gt: Date.now() },
      };
      if (email) query.email = email.toLowerCase().trim();
      else if (phone) query.phone = phone.trim();

      user = await User.findOne(query).select('+resetPasswordToken +resetPasswordOtp +resetPasswordExpires +refreshToken');
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a valid recovery token from your email link or a 6-digit OTP with your verified recovery channel.',
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired recovery proof token/OTP. Please request a new recovery link.',
      });
    }

    // Execute password reset
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    user.mustChangePassword = false;
    user.passwordChangedAt = Date.now();
    user.refreshToken = null; // Revoke active session refresh tokens

    await user.save();

    try {
      await ActivityLog.create({
        userId: user._id,
        action: 'PASSWORD_RESET_COMPLETED',
        details: 'Password was updated successfully via verified recovery channel proof',
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });
    } catch (err) {
      console.error('Failed to log reset activity:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You may now log in with your new credentials.',
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

/**
 * @desc    Dedicated Institution Admin Login (Accepts Admin ID or Official Email)
 * @route   POST /api/auth/admin-login
 * @access  Public
 */
const adminLogin = async (req, res, next) => {
  try {
    const rawIdentifier = (req.body.identifier || req.body.adminId || req.body.email || '').toString().trim();
    const { password } = req.body;

    if (!rawIdentifier || !password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Admin ID or password.',
      });
    }

    const user = await User.findOne({
      $or: [
        { adminId: rawIdentifier.toUpperCase() },
        { adminLoginId: rawIdentifier.toUpperCase() },
        { email: rawIdentifier.toLowerCase() },
      ],
      role: { $in: ['institution_admin', 'admin', 'super_admin'] },
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Admin ID or password.',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Administrative access suspended. Contact platform administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Admin ID or password.',
      });
    }

    const token = user.generateAuthToken();
    const refreshToken = crypto.randomBytes(40).toString('hex');
    user.refreshToken = refreshToken;
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: 'ADMIN_LOGIN',
      details: `Institution Admin ${user.email} logged in via ${rawIdentifier}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: 'Institution Admin login successful',
      data: { user, token, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Dedicated Platform Super Admin Login
 * @route   POST /api/auth/super-admin-login
 * @access  Public
 */
const superAdminLogin = async (req, res, next) => {
  try {
    const rawIdentifier = (req.body.identifier || req.body.email || '').toString().trim();
    const { password } = req.body;

    if (!rawIdentifier || !password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Super Admin credentials.',
      });
    }

    const user = await User.findOne({
      $or: [
        { email: rawIdentifier.toLowerCase() },
        { maviId: rawIdentifier.toUpperCase() },
        { adminId: rawIdentifier.toUpperCase() },
      ],
      role: { $in: ['super_admin', 'platform_owner', 'owner'] },
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Super Admin credentials.',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Super Admin account suspended.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Super Admin credentials.',
      });
    }

    const token = user.generateAuthToken();
    const refreshToken = crypto.randomBytes(40).toString('hex');
    user.refreshToken = refreshToken;
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: 'SUPER_ADMIN_LOGIN',
      details: `Platform Super Admin ${user.email} logged in`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: 'Super Admin login successful',
      data: { user, token, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Admin Invitation Token
 * @route   GET /api/auth/verify-admin-invite/:token
 * @access  Public
 */
const verifyAdminInvite = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      invitationToken: token,
      invitationExpires: { $gt: Date.now() },
    }).populate('institutionId', 'name shortName tenantId logo');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invitation link is invalid or has expired.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        adminId: user.adminId,
        designation: user.designation,
        institution: user.institutionId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Accept Admin Invitation and Set Password
 * @route   POST /api/auth/accept-admin-invite
 * @access  Public
 */
const acceptAdminInvite = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Valid token and password (at least 6 characters) required.',
      });
    }

    const user = await User.findOne({
      invitationToken: token,
      invitationExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invitation link is invalid or has expired.',
      });
    }

    user.password = password;
    user.status = 'active';
    user.isInvitedAdmin = false;
    user.invitationToken = null;
    user.invitationExpires = null;
    user.emailVerified = true;

    const jwtToken = user.generateAuthToken();
    const refreshToken = crypto.randomBytes(40).toString('hex');
    user.refreshToken = refreshToken;

    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: 'ADMIN_INVITE_ACCEPTED',
      details: `Admin ${user.email} accepted invitation and activated account`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: 'Admin account activated successfully.',
      data: { user, token: jwtToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change User Password (supports both mandatory and voluntary password changes)
 * @route   POST /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and password confirmation are required.',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation password do not match.',
      });
    }

    // Password strength check (min 6 chars, uppercase, lowercase, number)
    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (newPassword.length < 6 || !passwordPolicy.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters and contain an uppercase letter, lowercase letter, and number.',
      });
    }

    // Fetch user securely using req.user.id from JWT
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    // Voluntary password change REQUIRES valid current password
    if (!user.mustChangePassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to perform a password update.',
        });
      }

      const isCurrentMatch = await user.comparePassword(currentPassword);
      if (!isCurrentMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }
    } else if (currentPassword) {
      // Mandatory change with current password provided — verify if correct
      const isCurrentMatch = await user.comparePassword(currentPassword);
      if (!isCurrentMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }
    }

    // Ensure new password is different from current password
    const isSameAsOld = await user.comparePassword(newPassword);
    if (isSameAsOld) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from your current or temporary password.',
      });
    }

    // Update password credentials securely
    user.password = newPassword; // Pre-save hook hashes new password with bcrypt
    user.mustChangePassword = false;
    user.temporaryPasswordExpiresAt = null;
    user.passwordChangedAt = new Date();

    // Rotate refresh token & session JWT
    const newAuthToken = user.generateAuthToken();
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    user.refreshToken = newRefreshToken;

    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: 'Change Password',
      details: user.mustChangePassword ? 'Mandatory temporary password updated.' : 'Voluntary password changed from account security settings.',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    // Strip password field before returning user payload
    const userPayload = user.toObject();
    delete userPayload.password;
    delete userPayload.refreshToken;

    res.status(200).json({
      success: true,
      message: 'Your password has been changed successfully.',
      data: {
        user: userPayload,
        token: newAuthToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Account Activation Token
 * @route   GET /api/auth/verify-invitation/:token
 * @access  Public
 */
const verifyInvitationToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Invitation token is required.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      invitationToken: hashedToken,
      invitationExpires: { $gt: Date.now() },
    }).populate('institutionId', 'name shortName domain');

    if (!user) {
      return res.status(400).json({
        success: false,
        code: 'INVITATION_INVALID_OR_EXPIRED',
        message: 'Invitation link is invalid or has expired. Please contact your administrator to resend your invitation.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        maviId: user.maviId,
        institutionName: user.institutionId?.name || user.university?.name || 'Assigned Institution',
        identifierType: user.institutionalIdentifier?.identifierType || 'FACULTY_ID',
        identifierValue: user.institutionalIdentifier?.identifierValue || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Activate Invited Teacher/Recruiter Account & Create Password
 * @route   POST /api/auth/activate-account
 * @access  Public
 */
const activateAccount = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Invitation token and new password are required.',
      });
    }

    // Password policy validation: min 6 characters
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      invitationToken: hashedToken,
      invitationExpires: { $gt: Date.now() },
    }).select('+password +invitationToken');

    if (!user) {
      return res.status(400).json({
        success: false,
        code: 'INVITATION_INVALID_OR_EXPIRED',
        message: 'Invitation link is invalid or has expired. Please contact your administrator to resend your invitation.',
      });
    }

    // Set new password (hashed via pre-save hook)
    user.password = password;

    // Activate Account State
    user.emailVerified = true;
    user.accountStatus = 'ACTIVE';
    user.status = 'active';
    user.roleStatus = 'approved';
    user.passwordSetupRequired = false;
    user.mustChangePassword = false;
    user.passwordChangedAt = Date.now();

    // Generate JWT and Refresh Token for seamless session setup upon activation
    const authToken = user.generateAuthToken();
    const refreshToken = crypto.randomBytes(40).toString('hex');
    user.refreshToken = refreshToken;
    await user.save();

    // Log Security Audit Event
    await ActivityLog.create({
      userId: user._id,
      action: 'ACCOUNT_ACTIVATED',
      details: `Account activated for ${user.email} (${user.role.toUpperCase()}) via invitation link.`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: 'Your MAVI account has been activated successfully!',
      data: {
        user,
        token: authToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper to mask email for security logging (e.g. m***@gmail.com)
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '***@***.com';
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : `${local[0]}***`;
  return `${maskedLocal}@${domain}`;
};

/**
 * @desc    Request Email Change — Password Verification & OTP Generation
 * @route   POST /api/auth/email-change/request
 * @access  Private (Authenticated User)
 */
const requestEmailChange = async (req, res, next) => {
  try {
    const { newEmail, currentPassword } = req.body;

    if (!newEmail || !currentPassword) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'Both new email and current password are required.',
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const canonicalNewEmail = newEmail.trim().toLowerCase();
    if (!emailRegex.test(canonicalNewEmail)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_EMAIL',
        message: 'Please provide a valid email address.',
      });
    }

    // 1. Authenticate user & verify current password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      await AuditLog.create({
        actorId: user._id,
        actorRole: user.role,
        targetUserId: user._id,
        institutionId: user.institutionId || null,
        action: 'EMAIL_CHANGE_FAILED',
        details: { reason: 'Incorrect current password provided' },
        result: 'FAILURE',
      });
      return res.status(400).json({
        success: false,
        code: 'INVALID_CURRENT_PASSWORD',
        message: 'The current password provided is incorrect.',
      });
    }

    // 2. Check if new email is same as current email
    if (canonicalNewEmail === user.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        code: 'EMAIL_SAME_AS_CURRENT',
        message: 'New email address cannot be the same as your current email address.',
      });
    }

    // 3. Check email uniqueness against existing active accounts
    const existingUser = await User.findOne({ email: canonicalNewEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        code: 'EMAIL_ALREADY_IN_USE',
        message: 'This email address is already registered to another account.',
      });
    }

    // 4. Rate limiting: check for active challenge created less than 60 seconds ago
    const existingChallenge = await EmailChangeChallenge.findOne({
      userId: user._id,
      status: 'PENDING',
    }).sort({ createdAt: -1 });

    if (existingChallenge && Date.now() - new Date(existingChallenge.lastResendAt).getTime() < 60000) {
      const remainingSecs = Math.ceil((60000 - (Date.now() - new Date(existingChallenge.lastResendAt).getTime())) / 1000);
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: `Please wait ${remainingSecs} seconds before requesting another verification code.`,
      });
    }

    // Invalidate any older PENDING challenges for this user
    await EmailChangeChallenge.updateMany(
      { userId: user._id, status: 'PENDING' },
      { $set: { status: 'EXPIRED' } }
    );

    // 5. Generate cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // 6. Create EmailChangeChallenge document (valid for 15 minutes)
    await EmailChangeChallenge.create({
      userId: user._id,
      newEmail: canonicalNewEmail,
      hashedOtp,
      purpose: 'EMAIL_CHANGE',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      status: 'PENDING',
      lastResendAt: new Date(),
    });

    // 7. Dispatch OTP to NEW email via existing sendEmail utility
    const emailResult = await sendEmail({
      to: canonicalNewEmail,
      subject: 'Verify your MAVI Linking email change',
      html: generateEmailChangeOtpEmailHtml({ name: user.name, otp, newEmail: canonicalNewEmail }),
    });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please check email system configuration.',
      });
    }

    await AuditLog.create({
      actorId: user._id,
      actorRole: user.role,
      targetUserId: user._id,
      institutionId: user.institutionId || null,
      action: 'EMAIL_CHANGE_REQUESTED',
      details: { newEmailMasked: maskEmail(canonicalNewEmail) },
      result: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${canonicalNewEmail}. Please verify within 15 minutes.`,
      data: {
        newEmail: canonicalNewEmail,
        expiresInMinutes: 15,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP & Atomically Update Email Address
 * @route   POST /api/auth/email-change/verify
 * @access  Private (Authenticated User)
 */
const verifyEmailChange = async (req, res, next) => {
  try {
    const { otp, newEmail } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_OTP',
        message: 'Verification OTP code is required.',
      });
    }

    const userId = req.user._id;

    // Retrieve active challenge for user
    const challengeQuery = { userId, status: 'PENDING' };
    if (newEmail) {
      challengeQuery.newEmail = newEmail.trim().toLowerCase();
    }

    const challenge = await EmailChangeChallenge.findOne(challengeQuery).sort({ createdAt: -1 });

    if (!challenge) {
      return res.status(400).json({
        success: false,
        code: 'CHALLENGE_NOT_FOUND',
        message: 'No active email change request found. Please request a new verification code.',
      });
    }

    // Check expiry
    if (new Date() > new Date(challenge.expiresAt)) {
      challenge.status = 'EXPIRED';
      await challenge.save();

      await AuditLog.create({
        actorId: userId,
        action: 'EMAIL_CHANGE_EXPIRED',
        details: { newEmailMasked: maskEmail(challenge.newEmail) },
        result: 'FAILURE',
      });

      return res.status(400).json({
        success: false,
        code: 'OTP_EXPIRED',
        message: 'The verification code has expired. Please request a new code.',
      });
    }

    // Check attempt limits
    if (challenge.attemptCount >= challenge.maxAttempts) {
      challenge.status = 'MAX_ATTEMPTS_EXCEEDED';
      await challenge.save();

      return res.status(400).json({
        success: false,
        code: 'OTP_ATTEMPTS_EXCEEDED',
        message: 'Maximum verification attempts exceeded. Please request a new code.',
      });
    }

    // Increment attempt counter
    challenge.attemptCount += 1;

    // Verify submitted OTP hash against stored SHA-256 hash
    const submittedHash = crypto.createHash('sha256').update(otp.toString().trim()).digest('hex');

    if (submittedHash !== challenge.hashedOtp) {
      await challenge.save();

      await AuditLog.create({
        actorId: userId,
        action: 'EMAIL_CHANGE_FAILED',
        details: { reason: 'Invalid OTP code entered', attemptCount: challenge.attemptCount },
        result: 'FAILURE',
      });

      return res.status(400).json({
        success: false,
        code: 'OTP_INVALID',
        message: `Invalid verification code. ${challenge.maxAttempts - challenge.attemptCount} attempt(s) remaining.`,
      });
    }

    // RACE CONDITION PROTECTION: Re-verify email uniqueness immediately before DB update
    const isEmailTaken = await User.findOne({ email: challenge.newEmail, _id: { $ne: userId } });
    if (isEmailTaken) {
      challenge.status = 'EXPIRED';
      await challenge.save();

      return res.status(409).json({
        success: false,
        code: 'EMAIL_ALREADY_IN_USE',
        message: 'This email address is no longer available.',
      });
    }

    // Retrieve user and capture old email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const oldEmail = user.email;
    const targetNewEmail = challenge.newEmail;

    // Atomic User Update: Only email and emailVerified change.
    // MAVI ID, PRN, role, institution, projects, linked accounts remain 100% untouched.
    user.email = targetNewEmail;
    user.emailVerified = true;
    await user.save();

    // Invalidate Challenge
    challenge.status = 'USED';
    challenge.usedAt = new Date();
    await challenge.save();

    // Dispatch Security Notification to OLD Email
    await sendEmail({
      to: oldEmail,
      subject: 'Your MAVI Linking email address was changed',
      html: generateEmailChangeNotificationOldEmailHtml({
        name: user.name,
        oldEmail,
        newEmail: targetNewEmail,
        maviId: user.maviId,
        timestamp: new Date().toUTCString(),
      }),
    });

    // Record Security Audit Event
    await AuditLog.create({
      actorId: user._id,
      actorRole: user.role,
      targetUserId: user._id,
      institutionId: user.institutionId || null,
      action: 'EMAIL_CHANGED',
      details: {
        oldEmailMasked: maskEmail(oldEmail),
        newEmailMasked: maskEmail(targetNewEmail),
        maviId: user.maviId,
      },
      result: 'SUCCESS',
    });

    // Generate fresh auth JWT reflecting updated email
    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Your email address has been successfully updated.',
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
 * @desc    Resend Email Change Verification OTP
 * @route   POST /api/auth/email-change/resend
 * @access  Private (Authenticated User)
 */
const resendEmailChangeOtp = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const challenge = await EmailChangeChallenge.findOne({ userId, status: 'PENDING' }).sort({ createdAt: -1 });

    if (!challenge) {
      return res.status(400).json({
        success: false,
        code: 'CHALLENGE_NOT_FOUND',
        message: 'No pending email change verification session found. Please start a new request.',
      });
    }

    // Rate Limit: Minimum 60s resend interval
    if (Date.now() - new Date(challenge.lastResendAt).getTime() < 60000) {
      const remainingSecs = Math.ceil((60000 - (Date.now() - new Date(challenge.lastResendAt).getTime())) / 1000);
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: `Please wait ${remainingSecs} seconds before requesting another code.`,
      });
    }

    // Generate new OTP & hash
    const otp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    challenge.hashedOtp = hashedOtp;
    challenge.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    challenge.lastResendAt = new Date();
    challenge.resendCount += 1;
    challenge.attemptCount = 0; // reset attempt counter on fresh resend
    await challenge.save();

    const user = await User.findById(userId);

    await sendEmail({
      to: challenge.newEmail,
      subject: 'Verify your MAVI Linking email change',
      html: generateEmailChangeOtpEmailHtml({ name: user?.name || 'User', otp, newEmail: challenge.newEmail }),
    });

    await AuditLog.create({
      actorId: userId,
      action: 'EMAIL_CHANGE_VERIFICATION_SENT',
      details: { newEmailMasked: maskEmail(challenge.newEmail), resendCount: challenge.resendCount },
      result: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: `A new 6-digit verification code has been sent to ${challenge.newEmail}.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  superAdminLogin,
  verifyAdminInvite,
  acceptAdminInvite,
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
  changePassword,
  verifyInvitationToken,
  activateAccount,
  requestEmailChange,
  verifyEmailChange,
  resendEmailChangeOtp,
};

