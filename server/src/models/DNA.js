const mongoose = require('mongoose');

const dnaEvolutionEntrySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  personalityType: { type: String },
  scores: {
    collaboration: Number,
    innovation: Number,
    learningAdaptability: Number,
    consistency: Number,
  },
  trigger: { type: String, default: 'analysis' }, // analysis, milestone, manual
}, { _id: false });

const dnaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    personalityType: {
      type: String,
      enum: [
        'Problem Solver', 'Project Builder', 'Open Source Contributor',
        'Startup Engineer', 'Scale Architect', 'Research Engineer',
        'Product Builder', 'Performance Optimizer', 'Open Source Maintainer',
        'Full Stack Generalist', 'DevOps Engineer', 'AI/ML Specialist',
      ],
      default: 'Problem Solver',
    },
    workingStyle: {
      type: String,
      enum: ['Independent', 'Collaborative', 'Hybrid', 'Mentorship-Driven', 'Sprint-Based'],
      default: 'Independent',
    },
    scores: {
      collaboration: { type: Number, default: 50 },
      innovation: { type: Number, default: 50 },
      learningAdaptability: { type: Number, default: 50 },
      consistency: { type: Number, default: 50 },
    },
    // Extended scoring dimensions
    extendedScores: {
      engineeringMaturity: { type: Number, default: 0 },
      problemSolvingDepth: { type: Number, default: 0 },
      systemDesign: { type: Number, default: 0 },
      codeQuality: { type: Number, default: 0 },
      technicalDiversity: { type: Number, default: 0 },
    },
    description: { type: String },
    strengths: [String],
    weaknesses: [String],
    // Evolution timeline — snapshots of personality over time
    evolution: [dnaEvolutionEntrySchema],
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DNA', dnaSchema);
