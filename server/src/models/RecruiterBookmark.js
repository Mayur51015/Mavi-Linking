const mongoose = require('mongoose');

const recruiterBookmarkSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    developerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: { type: String, default: '' },
    tags: [String], // e.g., ['frontend', 'strong-candidate', 'interviewed']
    status: {
      type: String,
      enum: ['saved', 'contacted', 'interviewing', 'hired', 'rejected'],
      default: 'saved',
    },
  },
  { timestamps: true }
);

recruiterBookmarkSchema.index({ recruiterId: 1, developerId: 1 }, { unique: true });
recruiterBookmarkSchema.index({ recruiterId: 1, status: 1 });

module.exports = mongoose.model('RecruiterBookmark', recruiterBookmarkSchema);
