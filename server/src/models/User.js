const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
      // 'developer' and 'professor' are legacy values kept for backward compatibility
      // They are auto-migrated to 'user' and 'teacher' on next auth request
      enum: ['user', 'recruiter', 'teacher', 'admin', 'developer', 'professor'],
      default: 'user',
    },
    isPublic: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null },
    university: {
      name: { type: String, default: '' },
      department: { type: String, default: '' },
      batch: { type: String, default: '' },
    },
    // Student-specific fields
    degree: { type: String, default: '' },
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
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
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
    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
userSchema.index({ 'scores.overall': -1 });
userSchema.index({ role: 1 });
userSchema.index({ 'university.name': 1, 'university.department': 1 });

// ─── Pre-save: Hash password before persisting ──────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if password field was modified
  if (!this.isModified('password')) return next();

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
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// ─── Instance method: Return user data without sensitive fields ─────────────
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);
