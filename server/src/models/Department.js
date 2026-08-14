const mongoose = require('mongoose');

/**
 * Department Schema — represents an academic department (e.g., Computer Engineering, IT)
 * belonging to a specific multi-tenant Institution.
 */
const departmentSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'Institution ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    headUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

departmentSchema.index({ institutionId: 1, name: 1 }, { unique: true });
departmentSchema.index({ institutionId: 1 });
departmentSchema.index({ status: 1 });

module.exports = mongoose.model('Department', departmentSchema);
