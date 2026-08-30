const mongoose = require('mongoose');

/**
 * CareerScenario Schema
 * Stores saved hypothetical What-If scenarios created in MAVI Career Lab.
 * IMPORTANT: This model stores only hypothetical parameters, never real user achievements.
 */
const careerScenarioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Scenario name is required'],
      trim: true,
      maxlength: [100, 'Scenario name cannot exceed 100 characters'],
    },
    targetRole: {
      type: String,
      required: [true, 'Target role is required'],
      trim: true,
    },
    domain: {
      type: String,
      trim: true,
      default: '',
    },
    hypotheticalChanges: {
      skills: [{ type: String, trim: true }],
      projects: [
        {
          title: { type: String, trim: true },
          category: {
            type: String,
            enum: ['production_project', 'backend_project', 'frontend_project', 'cloud_deployment', 'testing_project', 'other'],
            default: 'other',
          },
          technologies: [{ type: String, trim: true }],
          description: { type: String, trim: true },
        },
      ],
      coding: {
        additionalSolved: { type: Number, default: 0 },
        mediumSolved: { type: Number, default: 0 },
      },
      development: {
        additionalRepos: { type: Number, default: 0 },
        openSourceContribution: { type: Boolean, default: false },
        testingAdded: { type: Boolean, default: false },
      },
      profile: {
        completedMissing: { type: Boolean, default: false },
        certifications: [{ type: String, trim: true }],
      },
    },
    simulationResult: {
      currentMatch: { type: Number, default: 0 },
      simulatedMatch: { type: Number, default: 0 },
      estimatedImpact: { type: Number, default: 0 },
      highestImpactAction: {
        title: { type: String, default: '' },
        impact: { type: Number, default: 0 },
      },
      breakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    scoringVersion: {
      type: String,
      default: '1.0',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CareerScenario', careerScenarioSchema);
