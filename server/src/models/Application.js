const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
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
    status: {
      type: String,
      enum: [
        'Applied',
        'Shortlisted',
        'Interview Scheduled',
        'Technical Round',
        'HR Round',
        'Selected',
        'Offer Sent',
        'Joined',
        'Rejected'
      ],
      default: 'Applied',
    },
    offerLetterUrl: {
      type: String,
      default: null,
    },
    joiningLetterUrl: {
      type: String,
      default: null,
    },
    notes: {
      type: String, // Recruiter private notes
      default: '',
    }
  },
  { timestamps: true }
);

applicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
