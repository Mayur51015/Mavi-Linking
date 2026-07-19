const mongoose = require('mongoose');

const careerAnalyticsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  month: { type: String, required: true }, // e.g. '2026-07'
  profileViews: { type: Number, default: 0 },
  projectCount: { type: Number, default: 0 },
  codingScore: { type: Number, default: 0 }
});

careerAnalyticsSchema.index({ user: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('CareerAnalytics', careerAnalyticsSchema);
