const mongoose = require('mongoose');

const leetCodeAnalyticsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    ranking: { type: Number, default: null },
    totalSolved: { type: Number, default: 0 },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    contestRating: { type: Number, default: null },
    contributionPoints: { type: Number, default: 0 },
    reputation: { type: Number, default: 0 },
    badges: { type: Array, default: [] },
    recentSubmissions: { type: Array, default: [] },
    aiInsight: {
      summary: { type: String, default: '' },
      problemSolvingScore: { type: Number, default: 0 },
      competitiveProgrammingScore: { type: Number, default: 0 },
      consistencyScore: { type: Number, default: 0 },
      contestPerformanceScore: { type: Number, default: 0 },
      generatedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LeetCodeAnalytics', leetCodeAnalyticsSchema);
