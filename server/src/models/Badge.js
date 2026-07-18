const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    badgeId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: '', // can be a lucide icon name or URL
    },
    awardedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Prevent duplicate badges for the same user
badgeSchema.index({ user: 1, badgeId: 1 }, { unique: true });

module.exports = mongoose.model('Badge', badgeSchema);
