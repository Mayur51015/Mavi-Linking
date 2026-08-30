const mongoose = require('mongoose');

const externalIdentitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    platform: {
      type: String,
      enum: ['github', 'codeforces', 'leetcode', 'stackoverflow'],
      required: true,
    },

    externalUsername: {
      type: String,
      required: true,
      trim: true,
    },

    externalUserId: {
      type: String,
      required: true,
      trim: true,
    },

    platformAccountId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'failed'],
      default: 'pending',
    },

    verificationMethod: {
      type: String,
      enum: ['platform_profile_lookup'],
      default: 'platform_profile_lookup',
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    lastSuccessfulSync: {
      type: Date,
      default: null,
    },

    linkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

externalIdentitySchema.index(
  { platform: 1, externalUserId: 1 },
  { unique: true }
);

externalIdentitySchema.index({
  userId: 1,
  platform: 1,
});

module.exports = mongoose.model(
  'ExternalIdentity',
  externalIdentitySchema
);