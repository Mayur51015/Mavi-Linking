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
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
  },
  { timestamps: true }
);

jobSchema.index({ recruiterId: 1 });
jobSchema.index({ companyId: 1 });
jobSchema.index({ status: 1 });

module.exports = mongoose.model('Job', jobSchema);
