const mongoose = require('mongoose');

/**
 * RecruitmentPipeline — tracks every candidate through the hiring
 * lifecycle for a specific recruiter/company. Supports interview
 * scheduling, offer management, and a full event timeline.
 */
const recruitmentPipelineSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    companyName: { type: String, required: true },
    role: { type: String, required: true },

    status: {
      type: String,
      enum: [
        'Applied',
        'Under Review',
        'Shortlisted',
        'Interview Scheduled',
        'Technical Round',
        'HR Round',
        'Selected',
        'Offer Sent',
        'Offer Received',
        'Offer Accepted',
        'Joined',
        'Placed',
        'Rejected',
      ],
      default: 'Applied',
    },

    availabilityStatus: { type: String, default: '' },

    recruiterMessage: { type: String, default: '' },
    recruiterNotes: { type: String, default: '' },
    nextAction: { type: String, default: '' },
    joiningLetterUrl: { type: String, default: '' },

    interviewDetails: {
      interviewDate: { type: Date, default: null },
      interviewMode: { type: String, default: '' }, // 'Online', 'In-Person', 'Hybrid'
      meetingLink: { type: String, default: '' },
    },

    offerDetails: {
      ctc: { type: String, default: '' },
      joiningDate: { type: Date, default: null },
      offerLetterUrl: { type: String, default: '' },
    },

    offerAccepted: { type: Boolean, default: false },

    timeline: [
      {
        status: { type: String, required: true },
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
recruitmentPipelineSchema.index({ studentId: 1, recruiterId: 1 });
recruitmentPipelineSchema.index({ recruiterId: 1, status: 1 });
recruitmentPipelineSchema.index({ studentId: 1, status: 1 });
recruitmentPipelineSchema.index({ companyName: 1 });

module.exports = mongoose.model('RecruitmentPipeline', recruitmentPipelineSchema);
