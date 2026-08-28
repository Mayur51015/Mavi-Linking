const mongoose = require('mongoose');

const roadmapItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started',
    },
    resources: [{ type: String }],
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
  },
  { _id: false }
);

const roadmapPhaseSchema = new mongoose.Schema(
  {
    phaseNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    estimatedTimeline: { type: String, default: '' },
    items: [roadmapItemSchema],
  },
  { _id: false }
);

const skillGapSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['strong', 'improve', 'learn'],
      required: true,
    },
    currentLevel: { type: String, default: 'Beginner' },
    requiredLevel: { type: String, default: 'Proficient' },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const recommendedProjectSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    skillsPracticed: [{ type: String }],
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },
    expectedOutcome: { type: String, default: '' },
    suggestedTechnologies: [{ type: String }],
  },
  { _id: false }
);

const careerAlignmentSchema = new mongoose.Schema(
  {
    role: { type: String, required: true },
    alignmentScore: { type: Number, default: 75 },
    matchReason: { type: String, default: '' },
  },
  { _id: false }
);

const careerRoadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    maviId: {
      type: String,
      default: '',
    },
    targetRole: {
      type: String,
      required: true,
      default: 'Full-Stack Developer',
      trim: true,
    },
    currentLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    profileStrength: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    missingProfileItems: [{ type: String }],
    currentSkills: [{ type: String }],
    existingStrengths: [{ type: String }],
    skillGaps: [skillGapSchema],
    roadmapPhases: [roadmapPhaseSchema],
    recommendedProjects: [recommendedProjectSchema],
    careerAlignment: [careerAlignmentSchema],
    nextAction: {
      stepTitle: { type: String, default: '' },
      description: { type: String, default: '' },
      phaseNumber: { type: Number, default: 1 },
      itemId: { type: String, default: '' },
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    lastProfileSyncAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CareerRoadmap', careerRoadmapSchema);
