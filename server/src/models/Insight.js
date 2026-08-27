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
    radar: [
      {
        axis: { type: String, required: true },
        score: { type: Number, required: true }
      }
    ],
    confidence: { type: Number, default: 80 },
    rawAiSummary: { type: String },

    claims: [
      {
        text: { type: String, required: true },
        evidenceIds: [{ type: String }],
      },
    ],

    uncertainty: {
      state: {
        type: String,
        enum: ['supported', 'uncertain'],
        default: 'supported',
      },
      reason: { type: String, default: null },
    },

    provenance: {
      evidence: [
        {
          id: { type: String, required: true },
          platform: { type: String, required: true },
          metric: { type: String, required: true },
          value: { type: mongoose.Schema.Types.Mixed },
          dataTimestamp: { type: Date, default: null },
        },
      ],
      sourcePlatforms: [String],
      dataTimestamps: [Date],
      provider: { type: String },
      model: { type: String },
      promptVersion: { type: String },
      schemaVersion: { type: String },
      generatedAt: { type: Date },
      evidenceCoverage: { type: Number, min: 0, max: 100 },
      uncertainty: {
        state: {
          type: String,
          enum: ['supported', 'uncertain'],
        },
        reason: { type: String, default: null },
      },
    },

    lastUpdated: { type: Date, default: Date.now },  },
  { timestamps: true }
);

module.exports = mongoose.model('Insight', insightSchema);
