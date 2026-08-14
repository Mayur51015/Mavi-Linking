const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorRole: {
      type: String,
      required: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      default: null,
    },
    tenantId: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      required: true,
      enum: [
        'STUDENT_PROFILE_UPDATED',
        'STUDENT_PRN_UPDATED',
        'STUDENT_ACADEMIC_INFO_UPDATED',
        'STUDENT_CONTACT_UPDATED',
        'STUDENT_PROFILE_PHOTO_UPDATED',
        'STUDENT_STATUS_UPDATED',
      ],
    },
    oldPRN: {
      type: String,
      default: null,
    },
    newPRN: {
      type: String,
      default: null,
    },
    changedFields: [
      {
        type: String,
      },
    ],
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    result: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'REJECTED'],
      default: 'SUCCESS',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ targetUserId: 1, createdAt: -1 });
auditLogSchema.index({ institutionId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
