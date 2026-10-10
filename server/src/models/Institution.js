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
    institutionCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    code: {
      type: String,
      sparse: true,
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
    logoStoragePath: {
      type: String,
      default: '',
    },
    verificationDocuments: [
      {
        title: { type: String, default: '' },
        fileUrl: { type: String, default: '' },
        storagePath: { type: String, default: '' },
        bucket: { type: String, default: 'institution-documents' },
        originalName: { type: String, default: '' },
        mimeType: { type: String, default: '' },
        fileSize: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
      }
    ],
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
      lowercase: true,
      trim: true,
      enum: ['active', 'suspended', 'ACTIVE', 'SUSPENDED'],
      default: 'active',
      set: (v) => (typeof v === 'string' ? v.toLowerCase().trim() : v),
    },
    plan: {
      type: String,
      uppercase: true,
      trim: true,
      enum: ['BASIC', 'PRO', 'ENTERPRISE', 'basic', 'pro', 'enterprise'],
      default: 'ENTERPRISE',
      set: (v) => (typeof v === 'string' ? v.toUpperCase().trim() : v),
    },
    licenseStatus: {
      type: String,
      lowercase: true,
      trim: true,
      enum: ['active', 'suspended', 'expired', 'ACTIVE', 'SUSPENDED', 'EXPIRED'],
      default: 'active',
      set: (v) => (typeof v === 'string' ? v.toLowerCase().trim() : v),
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'trial', 'cancelled', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'SUSPENDED'],
      default: 'active',
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    providerCustomerId: {
      type: String,
      default: '',
    },
    billingProfile: {
      gstin: { type: String, default: '' },
      billingEmail: { type: String, default: '' },
      billingPhone: { type: String, default: '' },
      billingAddress: { type: String, default: '' },
      taxId: { type: String, default: '' },
    },
    features: {
      developerDNA: { type: Boolean, default: true },
      recruiterAIReport: { type: Boolean, default: true },
      advancedAnalytics: { type: Boolean, default: true },
      aiCareerGuidance: { type: Boolean, default: true },
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
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

// Pre-save hook to ensure permanent, unique tenantId and institutionCode
institutionSchema.pre('validate', function (next) {
  const crypto = require('crypto');
  const codePrefix = (this.code || this.institutionCode || this.shortName || this.name.substring(0, 4)).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  if (!this.tenantId) {
    this.tenantId = `INST-${codePrefix.substring(0, 6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  }
  
  if (!this.institutionCode) {
    if (this.code) {
      this.institutionCode = this.code;
    } else {
      const cityPrefix = (this.city || 'HQ').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const randHex = crypto.randomBytes(3).toString('hex').toUpperCase();
      this.institutionCode = `${codePrefix.substring(0, 6)}-${cityPrefix.substring(0, 4)}-${randHex}`;
    }
  }

  if (!this.code && this.institutionCode) {
    this.code = this.institutionCode;
  }

  if (this.contactEmail && (!this.primaryContact || !this.primaryContact.email)) {
    if (!this.primaryContact) this.primaryContact = {};
    this.primaryContact.email = this.contactEmail;
  } else if (this.primaryContact && this.primaryContact.email && !this.contactEmail) {
    this.contactEmail = this.primaryContact.email;
  }

  next();
});

institutionSchema.index({ name: 1 });
institutionSchema.index({ domain: 1 });
institutionSchema.index({ status: 1 });

module.exports = mongoose.model('Institution', institutionSchema);
