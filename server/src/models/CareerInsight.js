const mongoose = require('mongoose');

const careerInsightSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  strengths: [{ type: String }],
  improvements: [{ type: String }],
  recommendedRoles: [{ type: String }],
  hiringRecommendation: { type: String, default: 'Needs Mentoring' },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CareerInsight', careerInsightSchema);
