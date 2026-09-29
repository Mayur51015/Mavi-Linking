const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    type: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Internship', 'Apprenticeship', 'Contract'],
      default: 'Full-time',
    },
    workMode: {
      type: String,
      enum: ['Remote', 'Hybrid', 'On-site'],
      default: 'On-site',
    },
    location: {
      type: String,
      default: 'Flexible',
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    department: {
      type: [String],
      default: [],
    },
    graduationYear: {
      type: [String],
      default: [],
    },
    experience: {
      type: String,
      default: 'Fresher',
    },
    package: {
      type: String,
      default: '',
    },
    stipend: {
      type: String,
      default: '',
    },
    responsibilities: {
      type: String,
      default: '',
    },
    eligibility: {
      type: String,
      default: '',
    },
    deadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
  },
  { timestamps: true }
);

jobSchema.index({ recruiterId: 1, status: 1 });
jobSchema.index({ companyId: 1 });
jobSchema.index({ status: 1, deadline: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ type: 1, workMode: 1 });

module.exports = mongoose.model('Job', jobSchema);

