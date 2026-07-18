const mongoose = require('mongoose');

const careerScoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  overall: { type: Number, default: 0 },
  development: { type: Number, default: 0 },
  problemSolving: { type: Number, default: 0 },
  community: { type: Number, default: 0 },
  breakdown: {
    academics: { type: Number, default: 0 },
    profileCompletion: { type: Number, default: 0 },
    resume: { type: Number, default: 0 },
    projects: { type: Number, default: 0 },
    certificates: { type: Number, default: 0 },
    platforms: { type: Number, default: 0 }
  },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CareerScore', careerScoreSchema);
