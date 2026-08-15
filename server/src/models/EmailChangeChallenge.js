const mongoose = require('mongoose');

/**
 * EmailChangeChallenge Schema — Cryptographically secure OTP verification challenge
 * for student/user email address changes.
 * Stores SHA-256 hashed OTPs with strict TTL expiry and brute-force attempt tracking.
 */
const emailChangeChallengeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    newEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    hashedOtp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['EMAIL_CHANGE'],
      default: 'EMAIL_CHANGE',
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
    lastResendAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatic TTL purge after expiration
    },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'USED', 'EXPIRED', 'MAX_ATTEMPTS_EXCEEDED'],
      default: 'PENDING',
      index: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

emailChangeChallengeSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('EmailChangeChallenge', emailChangeChallengeSchema);
