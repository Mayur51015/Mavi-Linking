const mongoose = require('mongoose');

const companyProfileSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    industry: {
      type: String,
      default: '',
    },
    companySize: {
      type: String,
      enum: ['', '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    hrContact: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompanyProfile', companyProfileSchema);
