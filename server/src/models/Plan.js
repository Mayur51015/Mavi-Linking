const mongoose = require('mongoose');

/**
 * Plan Schema — Defines commercial SaaS tiers (BASIC, PRO, ENTERPRISE, CUSTOM) with plan versioning.
 * Managed EXCLUSIVELY by PLATFORM_OWNER.
 */
const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Plan code is required'],
      uppercase: true,
      trim: true,
      enum: ['BASIC', 'PRO', 'ENTERPRISE', 'CUSTOM'],
    },
    version: {
      type: Number,
      default: 1,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      amount: { type: Number, default: 0 }, // Amount in INR
      currency: { type: String, default: 'INR' },
      interval: { type: String, enum: ['monthly', 'annual'], default: 'annual' },
    },
    limits: {
      maxStudents: { type: Number, default: 500 }, // 0 = Unlimited
      maxTeachers: { type: Number, default: 50 },
      maxRecruiters: { type: Number, default: 10 },
      maxDepartments: { type: Number, default: 5 },
      storageGb: { type: Number, default: 25 },
      aiMonthlyLimit: { type: Number, default: 1000 },
    },
    features: {
      developerDNA: { type: Boolean, default: true },
      recruiterAIReport: { type: Boolean, default: true },
      advancedAnalytics: { type: Boolean, default: true },
      aiCareerGuidance: { type: Boolean, default: true },
      placementEngine: { type: Boolean, default: true },
      customDomain: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Compound Index: Ensure (code + version) is unique so historical versions can coexist
planSchema.index({ code: 1, version: 1 }, { unique: true });
planSchema.index({ status: 1, code: 1 });

module.exports = mongoose.model('Plan', planSchema);
