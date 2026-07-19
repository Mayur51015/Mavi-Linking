const mongoose = require('mongoose');

const careerBadgeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  badgeId: { type: String, required: true }, // e.g. 'VERIFIED_STUDENT'
  name: { type: String, required: true },
  icon: { type: String, default: '' },
  awardedAt: { type: Date, default: Date.now }
});

careerBadgeSchema.index({ user: 1, badgeId: 1 }, { unique: true });

module.exports = mongoose.model('CareerBadge', careerBadgeSchema);
