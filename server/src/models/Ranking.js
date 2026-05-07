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
      enum: ['Bronze', 'Silver', 'Gold', 'Elite Developer'],
      default: 'Bronze' 
    },
    globalRank: { type: Number, default: 0 },
    score: { type: Number, default: 0 }, // dynamically calculated
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ranking', rankingSchema);
