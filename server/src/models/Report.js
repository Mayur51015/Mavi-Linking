const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportUrl: { type: String, required: true },
    type: {
      type: String,
      enum: ['Recruiter Summary', 'Technical Resume', 'Interview Report', 'AI Portfolio'],
      default: 'Recruiter Summary',
    },
    template: { type: String, default: 'default' }, // default, modern, minimal, executive
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String, default: null }, // for public sharing via link
    metadata: {
      includeInsights: { type: Boolean, default: true },
      includeRanking: { type: Boolean, default: true },
      includeDNA: { type: Boolean, default: true },
      includeProjects: { type: Boolean, default: true },
      includeStats: { type: Boolean, default: true },
    },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

reportSchema.index({ userId: 1, generatedAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
