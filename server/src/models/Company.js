const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    logo: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      default: '',
      trim: true,
    },
    industry: {
      type: String,
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

companySchema.index({ name: 1 });

module.exports = mongoose.model('Company', companySchema);
