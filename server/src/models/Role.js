const mongoose = require('mongoose');

/**
 * Role Schema — defines system and custom administrative roles
 * (e.g., PLACEMENT_ADMIN, ACADEMIC_ADMIN, EXAM_ADMIN, FINANCE_ADMIN, etc.)
 */
const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Role code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    scope: {
      type: String,
      enum: ['PLATFORM', 'INSTITUTION', 'DEPARTMENT'],
      default: 'INSTITUTION',
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      default: null, // null indicates global platform role template
    },
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

roleSchema.index({ code: 1 }, { unique: true });
roleSchema.index({ institutionId: 1 });

module.exports = mongoose.model('Role', roleSchema);
