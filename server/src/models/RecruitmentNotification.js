const mongoose = require('mongoose');

/**
 * RecruitmentNotification — stores realtime and historical notifications
 * for the recruitment workflow (status updates, interview invites,
 * offer notifications, placement confirmations, etc.).
 */
const recruitmentNotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    type: {
      type: String,
      enum: [
        'pipeline_started',
        'status_update',
        'interview_scheduled',
        'offer_received',
        'offer_accepted',
        'placement_confirmed',
        'message',
        'general',
        'job_posted',
        'application_accepted',
        'offer_letter',
        'recruiter_message',
        'teacher_announcement',
        'new_application',
        'teacher_recommendation',
        'interview_confirmation',
        'student_applied',
        'student_selected',
        'recruiter_feedback',
        'placement_completed'
      ],
      required: true,
    },

    title: { type: String, required: true },
    message: { type: String, default: '' },

    // Flexible metadata (e.g., pipelineId, companyName, role)
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
recruitmentNotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
recruitmentNotificationSchema.index({ recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('RecruitmentNotification', recruitmentNotificationSchema);
