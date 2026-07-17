const mongoose = require('mongoose');

const qrScanSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    profileId: {
      type: String, // The username of the scanned profile
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    deviceType: {
      type: String, // Mobile, Desktop, Tablet, etc.
      default: 'Unknown',
    },
    os: {
      type: String, // iOS, Android, Windows, macOS, etc.
      default: 'Unknown',
    },
    browser: {
      type: String, // Chrome, Safari, etc.
      default: 'Unknown',
    },
    ipAddress: {
      type: String, // Hashed
      required: true,
    },
    location: {
      country: { type: String, default: 'Unknown' },
      region: { type: String, default: 'Unknown' },
      city: { type: String, default: 'Unknown' },
    },
    referralSource: {
      type: String,
      enum: ['Resume', 'LinkedIn', 'Shared Link', 'QR Download', 'Unknown'],
      default: 'Unknown',
    },
    visitorType: {
      type: String,
      enum: ['Recruiter', 'Teacher', 'Student', 'Guest'],
      default: 'Guest',
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    isUnique: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes to speed up aggregation
qrScanSchema.index({ studentId: 1, timestamp: -1 });
qrScanSchema.index({ studentId: 1, isUnique: 1 });
qrScanSchema.index({ sessionId: 1, timestamp: -1 });

module.exports = mongoose.model('QRScan', qrScanSchema);
