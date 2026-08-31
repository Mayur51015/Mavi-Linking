const mongoose = require('mongoose');

const rankingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    tier: { 
      type: String, 
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite Developer'],
      default: 'Bronze' 
    },
        evidenceStatus: {
      type: String,
      enum: ['supported', 'uncertain'],
      default: 'uncertain',
    },
    globalRank: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    // Category-specific ranks
    categoryRanks: {
      codeQuality: { type: Number, default: 0 },
      projectComplexity: { type: Number, default: 0 },
      openSourceInfluence: { type: Number, default: 0 },
      consistencyScore: { type: Number, default: 0 },
      technicalDiversity: { type: Number, default: 0 },
      collaborationImpact: { type: Number, default: 0 },
    },
    // University ranking
    universityRank: { type: Number, default: 0 },
    departmentRank: { type: Number, default: 0 },
    // Historical snapshots
    history: [{
      date: { type: Date, default: Date.now },
      score: Number,
      globalRank: Number,
      tier: String,
    }],
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

rankingSchema.index({ score: -1 });
rankingSchema.index({ globalRank: 1 });
rankingSchema.index({ departmentRank: 1 });

module.exports = mongoose.model('Ranking', rankingSchema);

