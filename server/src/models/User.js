const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Credential-bearing fields that must never reach an API response.
 *
 * Each of these is also declared `select: false` on the schema, so the usual
 * way to get one is to ask for it explicitly (`.select('+refreshToken')`).
 * The list is re-applied in `toJSON()` as a backstop: an explicit select is
 * for server-side use, not for handing the value back to a client.
 */
const SENSITIVE_FIELDS = [
  'password',
  'refreshToken',
  'resetPasswordToken',
  'resetPasswordOtp',
  'resetPasswordExpires',
  'invitationToken',
  'invitationExpires',
  'verificationToken',
  'verificationTokenExpires',
  'verificationCode',
];

/**
 * User Schema — stores credentials and linked platform profiles.
 * Passwords are auto-hashed via pre-save middleware.
 * The `platforms` subdocument is scaffolded here for Phase 2.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    // Permanent MAVI ID (e.g., MAVI-8F3K7Q2P)
    maviId: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    // Public identity handle (unique slug for /u/:username)
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9_-]{3,30}$/, 'Username must be 3-30 chars (lowercase, digits, hyphens, underscores)'],
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'recruiter', 'teacher', 'admin', 'institution_admin', 'department_admin', 'super_admin', 'platform_owner', 'owner', 'developer', 'professor'],
      default: 'user',
    },
    roles: [
      {
        type: String,
        enum: ['user', 'student', 'teacher', 'recruiter', 'institution_admin', 'department_admin', 'super_admin', 'platform_owner', 'owner', 'admin', 'developer', 'professor'],
      },
    ],
    status: {
      type: String,
      enum: ['active', 'suspended', 'invited'],
      default: 'active',
    },
    accountStatus: {
      type: String,
      enum: ['INVITED', 'PENDING_VERIFICATION', 'EMAIL_VERIFICATION_PENDING', 'PASSWORD_SETUP_REQUIRED', 'ACTIVE', 'SUSPENDED', 'DISABLED', 'INVITATION_EXPIRED'],
      default: 'PENDING_VERIFICATION',
    },
    institutionalIdentifier: {
      identifierType: {
        type: String,
        enum: ['PRN', 'FACULTY_ID', 'EMPLOYEE_ID', 'RECRUITER_ID'],
        default: 'PRN',
      },
      identifierValue: {
        type: String,
        trim: true,
        default: '',
      },
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      default: null,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    tenantId: {
      type: String,
      trim: true,
      default: '',
    },
    adminId: {
      type: String,
      trim: true,
      default: '',
    },
    adminLoginId: {
      type: String,
      trim: true,
      default: '',
    },
    designation: {
      type: String,
      trim: true,
      default: '',
    },
    permissions: [
      {
        type: String,
      },
    ],
    invitationToken: {
      type: String,
      default: null,
      select: false,
    },
    invitationExpires: {
      type: Date,
      default: null,
    },
    passwordSetupRequired: {
      type: Boolean,
      default: false,
    },
    isInvitedAdmin: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local',
    },
    requestedRole: {
      type: String,
      enum: ['none', 'user', 'recruiter', 'teacher'],
      default: 'none',
    },
    roleStatus: {
      type: String,
      enum: ['active', 'pending', 'approved', 'rejected'],
      default: 'active',
    },
    roleVerification: {
      institution: { type: String, default: '' },
      department: { type: String, default: '' },
      designation: { type: String, default: '' },
      companyName: { type: String, default: '' },
      companyEmail: { type: String, default: '' },
      companyDomain: { type: String, default: '' },
      submittedAt: { type: Date, default: null },
      reviewedAt: { type: Date, default: null },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      rejectionReason: { type: String, default: '' },
    },
    isPublic: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null, select: false },
    university: {
      name: { type: String, default: '' },
      department: { type: String, default: '' },
      branch: { type: String, default: '' },
      year: { type: String, default: '' },
      division: { type: String, default: '' },
      semester: { type: String, default: '' },
      admissionYear: { type: String, default: '' },
      batch: { type: String, default: '' },
      graduationYear: { type: String, default: '' },
    },
    // Student-specific fields
    prn: { type: String, trim: true, default: '' },
    prnHistory: [
      {
        oldPRN: { type: String, default: '' },
        newPRN: { type: String, default: '' },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedByName: { type: String, default: '' },
        changedAt: { type: Date, default: Date.now }
      }
    ],
    facultyId: { type: String, trim: true, default: '' },
    prnVerificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    prnRejectionReason: { type: String, default: '' },
    prnVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    prnVerifiedAt: { type: Date, default: null },
    degree: { type: String, default: '' },
    cgpa: { type: Number, default: 0.0 },
    graduationYear: { type: String, default: '' },
    portfolioWebsite: { type: String, default: '' },
    githubUsername: { type: String, default: '' },
    preferredDomain: {
      type: String,
      enum: ['', 'Web Development', 'AI/ML', 'Competitive Programming', 'Cybersecurity', 'App Development'],
      default: '',
    },
    experienceLevel: {
      type: String,
      enum: ['', 'Beginner', 'Intermediate', 'Advanced'],
      default: '',
    },
    // Recruiter-specific fields
    companyName: { type: String, default: '' },
    allowedColleges: [{ type: String }],
    allowedDepartments: [{ type: String }],
    // Teacher-specific fields (college/department from university field)

    // ─── Placement & Availability (Candidate Lifecycle) ─────────────────
    placementStatus: {
      type: String,
      enum: [
        'Available for Hiring',
        'Under Review',
        'Interview Scheduled',
        'Offer Received',
        'Offer Accepted',
        'Placed / Hired',
        'Not Available',
        'Open to Opportunities',
      ],
      default: 'Available for Hiring',
    },
    availabilitySettings: {
      openToOpportunities: { type: Boolean, default: true },
      availableForInternship: { type: Boolean, default: false },
      availableForFullTime: { type: Boolean, default: true },
      hideFromRecruiters: { type: Boolean, default: false },
      publicProfile: { type: Boolean, default: true },
      notLookingForJobs: { type: Boolean, default: false },
    },
    placedCompany: { type: String, default: '' },
    placedRole: { type: String, default: '' },
    placementCTC: { type: String, default: '' },
    placementDate: { type: Date, default: null },

    // Security & Auth Upgrades
    // The token fields below are credentials, not profile data — they are
    // `select: false` so they only load when a handler explicitly asks for them.
    emailVerified: { type: Boolean, default: false },
    mustChangePassword: { type: Boolean, default: false },
    temporaryPasswordExpiresAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    verificationToken: { type: String, default: null, select: false },
    verificationTokenExpires: { type: Date, default: null, select: false },
    verificationTokenPurpose: { type: String, default: 'ACCOUNT_EMAIL_VERIFICATION' },
    resetPasswordToken: { type: String, default: null, select: false },
    resetPasswordOtp: { type: String, default: null, select: false },
    resetPasswordExpires: { type: Date, default: null, select: false },
    refreshToken: { type: String, default: null, select: false },

    // Documents & Profile sections
    documents: {
      resume: { type: String, default: '' },
      aadhaar: { type: String, default: '' },
      pan: { type: String, default: '' },
      marksheet: { type: String, default: '' },
      list: [
        {
          title: { type: String, required: true },
          type: { type: String, required: true },
          fileUrl: { type: String, required: true },
          uploadedAt: { type: Date, default: Date.now },
          description: { type: String, default: '' },
        }
      ]
    },
    certificates: [
      {
        title: { type: String, required: true },
        issuer: { type: String, default: '' },
        category: { type: String, default: '' },
        date: { type: Date, default: null },
        issueDate: { type: Date, default: null },
        expiryDate: { type: Date, default: null },
        credentialId: { type: String, default: '' },
        verificationUrl: { type: String, default: '' },
        description: { type: String, default: '' },
        fileUrl: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
        isVerified: { type: Boolean, default: false },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      }
    ],

    // ─── Dynamic Portfolio Documents (replaces fixed required-doc cards) ───────
    portfolioDocs: [
      {
        title:        { type: String, required: true },
        category: {
          type: String,
          enum: ['Resume', 'Certificate', 'Marksheet', 'Project Report', 'Internship', 'Achievement', 'Research Paper', 'Other'],
          default: 'Other',
        },
        description:  { type: String, default: '' },
        fileUrl:      { type: String, default: '' },
        originalName: { type: String, default: '' },
        uploadedAt:   { type: Date, default: Date.now },
        isVerified:   { type: Boolean, default: false },
        verifiedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      }
    ],

    achievements: [
      {
        title: { type: String, required: true },
        category: {
          type: String,
          enum: ['Hackathon', 'Competition', 'Award', 'Scholarship', 'Publication', 'Leadership', 'Volunteer', 'Open Source', 'Other'],
          default: 'Other'
        },
        description: { type: String, default: '' },
        date: { type: Date, default: null },
        isVerified: { type: Boolean, default: false },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      }
    ],
    skillsList: [
      {
        name: { type: String, required: true },
        isVerified: { type: Boolean, default: false },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      }
    ],


    profileSettings: {
      theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
      showEmail: { type: Boolean, default: false },
      resumeTemplate: { type: String, default: 'default' },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: false,
      select: false, // Never return password in queries by default
    },
    avatar: {
      type: String,
      default: '',
    },
    // Platform usernames — linked via Account Linking System (Phase 2)
    platforms: {
      github: {
        username: { type: String, default: '', trim: true },
        linkedAt: { type: Date, default: null },
      },
      codeforces: {
        username: { type: String, default: '', trim: true },
        linkedAt: { type: Date, default: null },
      },
      leetcode: {
        username: { type: String, default: '', trim: true },
        linkedAt: { type: Date, default: null },
      },
      stackoverflow: {
        username: { type: String, default: '', trim: true },
        linkedAt: { type: Date, default: null },
      },
    },
    // Cached data fetched from external APIs (Phase 3+)
    platformData: {
      github: { type: mongoose.Schema.Types.Mixed, default: null },
      codeforces: { type: mongoose.Schema.Types.Mixed, default: null },
      leetcode: { type: mongoose.Schema.Types.Mixed, default: null },
      stackoverflow: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    // Aggregated scores — populated in Phase 4
    scores: {
      development: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      knowledge: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
    },
    // AI Career Intelligence Fields
    aiAnalysis: {
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      recommendedRoles: [{ type: String }],
      hiringRecommendation: { type: String, default: '' },
    },
    placementReadinessScore: { type: Number, default: 0 },
    profileCompletion: { type: Number, default: 0 },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

userSchema.index({ status: 1 });
userSchema.index({ institutionId: 1 });
userSchema.index({ departmentId: 1 });
userSchema.index({ institutionId: 1, departmentId: 1 });
userSchema.index({ tenantId: 1 });
userSchema.index({ adminId: 1 });
userSchema.index({ adminLoginId: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ maviId: 1 }, { unique: true });
userSchema.index({ prn: 1 });
userSchema.index({ facultyId: 1 });
userSchema.index({ prnVerificationStatus: 1 });
userSchema.index({ institutionId: 1, prn: 1 });

// Helper to generate 8-char uppercase hex/alphanumeric code
const generateMaviIdCode = () => {
  return 'MAVI-' + require('crypto').randomBytes(4).toString('hex').toUpperCase();
};

// ─── Pre-save: Auto-generate maviId, sync roles & hash password ───────────
userSchema.pre('save', async function (next) {
  // Ensure googleId is unset if null or empty string to preserve sparse index
  if (this.googleId === null || this.googleId === '') {
    this.googleId = undefined;
  }

  // Generate permanent MAVI ID if missing (with collision check)
  if (!this.maviId) {
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      attempts++;
      const candidate = generateMaviIdCode();
      const existing = await mongoose.model('User').findOne({ maviId: candidate });
      if (!existing) {
        this.maviId = candidate;
        isUnique = true;
      }
    }
  }

  // Ensure roles array is populated and consistent with primary role
  if (!this.roles || this.roles.length === 0) {
    this.roles = [this.role || 'user'];
  } else if (this.role && !this.roles.includes(this.role)) {
    this.roles.push(this.role);
  }

  // Only hash if password field was modified and present
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ─── Instance method: Compare candidate password with stored hash ───────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance method: Generate signed JWT ───────────────────────────────────
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET || 'default_mavi_secret_key_2026',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// ─── Instance method: Return user data without sensitive fields ─────────────
// Called automatically by res.json(), so this is the last line of defence for
// anything that made it onto the document via an explicit `+field` select.
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  SENSITIVE_FIELDS.forEach((field) => delete user[field]);
  delete user.__v;
  return user;
};

// Exposed so callers and tests can assert against one source of truth rather
// than re-typing the list (e.g. User.SENSITIVE_FIELDS).
userSchema.statics.SENSITIVE_FIELDS = SENSITIVE_FIELDS;

module.exports = mongoose.model('User', userSchema);
