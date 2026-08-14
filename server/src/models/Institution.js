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
    code: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true,
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

institutionSchema.index({ name: 1 });
institutionSchema.index({ domain: 1 });
institutionSchema.index({ status: 1 });

module.exports = mongoose.model('Institution', institutionSchema);
