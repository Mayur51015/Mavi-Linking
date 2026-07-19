const mongoose = require('mongoose');

const careerSkillAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: { type: String, required: true },
    topSkills: [String],
    confidence: { type: Number, required: true },
    radar: [
      {
        axis: { type: String, required: true },
        score: { type: Number, required: true }
      }
    ],
    generatedAt: { type: Date, default: Date.now },
    analysisVersion: { type: String, default: '1.0.0' }
  },
  {
    collection: 'career_skill_analysis',
    timestamps: true
  }
);

module.exports = mongoose.model('CareerSkillAnalysis', careerSkillAnalysisSchema);
