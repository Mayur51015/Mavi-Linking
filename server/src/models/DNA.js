const mongoose = require('mongoose');

const dnaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    personalityType: { type: String, default: 'Problem Solver' }, // Problem Solver, Project Builder, Open Source Contributor, etc.
    workingStyle: { type: String, default: 'Independent' },
    scores: {
      collaboration: { type: Number, default: 50 },
      innovation: { type: Number, default: 50 },
      learningAdaptability: { type: Number, default: 50 },
      consistency: { type: Number, default: 50 },
    },
    description: { type: String },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DNA', dnaSchema);
