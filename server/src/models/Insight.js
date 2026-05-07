const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: { type: String, default: 'Software Engineer' },
    topSkills: [String],
    techStack: [String],
    confidenceScores: {
      type: Map,
      of: Number,
      default: {},
    },
    strengths: [String],
    improvements: [String],
    careerRecommendations: [String],
    rawAiSummary: { type: String },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Insight', insightSchema);
