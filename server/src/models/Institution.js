const mongoose = require('mongoose');

/**
 * Institution Schema — represents a university, college, institute, or organization.
 * Used for multi-tenant institution scoping and membership controls.
 */
const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
      minlength: [2, 'Institution name must be at least 2 characters'],
      maxlength: [150, 'Institution name cannot exceed 150 characters'],
    },
    tenantId: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      trim: true,
    },
    shortName: {
      type: String,
      trim: true,
      default: '',
    },
    officialDomain: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['University', 'College', 'Institute', 'School', 'Organization'],
      default: 'College',
    },
    address: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: 'India',
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
    plan: {
      type: String,
      enum: ['BASIC', 'PRO', 'ENTERPRISE'],
      default: 'ENTERPRISE',
    },
    licenseStatus: {
      type: String,
      enum: ['active', 'suspended', 'expired'],
      default: 'active',
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'trial', 'cancelled'],
      default: 'active',
    },
    features: {
      developerDNA: { type: Boolean, default: true },
      recruiterAIReport: { type: Boolean, default: true },
      advancedAnalytics: { type: Boolean, default: true },
      aiCareerGuidance: { type: Boolean, default: true },
    },
    primaryContact: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure permanent, unique tenantId
institutionSchema.pre('validate', function (next) {
  if (!this.tenantId) {
    const crypto = require('crypto');
    const codePrefix = (this.code || this.shortName || this.name.substring(0, 4)).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    this.tenantId = `INST-${codePrefix.substring(0, 6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  }
  next();
});

institutionSchema.index({ tenantId: 1 }, { unique: true });
institutionSchema.index({ name: 1 });
institutionSchema.index({ domain: 1 });
institutionSchema.index({ status: 1 });

module.exports = mongoose.model('Institution', institutionSchema);
