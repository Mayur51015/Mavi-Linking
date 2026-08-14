const mongoose = require('mongoose');

/**
 * InstitutionMembership Schema — defines a user's scoped role and authorization
 * within a specific institution (multi-tenant scope layer).
 */
const institutionMembershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['institution_admin', 'teacher', 'student'],
      required: true,
    },
    permissions: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended', 'rejected'],
      default: 'active',
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate active memberships for the same user in an institution
institutionMembershipSchema.index({ userId: 1, institutionId: 1 }, { unique: true });
institutionMembershipSchema.index({ institutionId: 1, role: 1 });

module.exports = mongoose.model('InstitutionMembership', institutionMembershipSchema);
