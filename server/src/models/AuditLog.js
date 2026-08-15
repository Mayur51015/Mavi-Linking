const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorRole: {
      type: String,
      default: 'system',
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    previousRole: {
      type: String,
      default: '',
    },
    newRole: {
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
        'STUDENT_CREATED',
        'TEACHER_CREATED',
        'RECRUITER_CREATED',
        'DEPARTMENT_CREATED',
        'DEPARTMENT_UPDATED',
        'DEPARTMENT_TRANSFER',
        'DEPARTMENT_ADMIN_CREATED',
        'DEPARTMENT_ADMIN_APPOINTED',
        'DEPARTMENT_ADMIN_REASSIGNED',
        'DEPARTMENT_ADMIN_SUSPENDED',
        'DEPARTMENT_ADMIN_REACTIVATED',
        'DEPARTMENT_ADMIN_INVITED',
        'DEPARTMENT_ADMIN_ACTIVATED',
        'INSTITUTION_CREATED',
        'INSTITUTION_UPDATED',
        'INSTITUTION_SUSPENDED',
        'INSTITUTION_ADMIN_CREATED',
        'PLAN_CREATED',
        'PLAN_UPDATED',
        'PLAN_PUBLISHED',
        'PLAN_UNPUBLISHED',
        'PLAN_ARCHIVED',
        'PLAN_VERSION_CREATED',
        'PRICE_CHANGED',
        'INSTITUTION_PLAN_ASSIGNED',
        'SUBSCRIPTION_CREATED',
        'SUBSCRIPTION_CHECKOUT_INITIATED',
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'SUBSCRIPTION_SUSPENDED',
        'SUBSCRIPTION_CANCELLED',
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
