const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: { type: String, required: true }, // e.g., '2026-05'
    repoGrowth: { type: Number, default: 0 },
    starGrowth: { type: Number, default: 0 },
    followerGrowth: { type: Number, default: 0 },
    contributionGrowth: { type: Number, default: 0 },
    aiSummary: { type: String },
  },
  { timestamps: true }
);

analyticsSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
