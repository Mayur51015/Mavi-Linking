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
      ref: 'CompanyProfile',
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
    requiredSkills: [{ type: String }],
    salary: {
      type: String, // e.g., '10 LPA', '$100k - $120k'
      default: 'Not disclosed',
    },
    experience: {
      type: String, // e.g., 'Fresher', '1-3 Years'
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    lastDate: {
      type: Date,
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Internship', 'Contract'],
      default: 'Full-time',
    },
    status: {
      type: String,
      enum: ['Open', 'Closed'],
      default: 'Open',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
