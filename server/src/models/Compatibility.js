const mongoose = require('mongoose');

const compatibilitySchema = new mongoose.Schema(
  {
    userIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    overallScore: { type: Number, default: 0 }, // 0-100
    breakdown: {
      skillComplementarity: { type: Number, default: 0 },
      workStyleMatch: { type: Number, default: 0 },
      codingBehavior: { type: Number, default: 0 },
      contributionBalance: { type: Number, default: 0 },
      personalityFit: { type: Number, default: 0 },
    },
    complementaryStrengths: [String],
    recommendedRoles: mongoose.Schema.Types.Mixed, // { userId: 'role' }
    aiSummary: { type: String },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

compatibilitySchema.index({ userIds: 1 });

module.exports = mongoose.model('Compatibility', compatibilitySchema);
