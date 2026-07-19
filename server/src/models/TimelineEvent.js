const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['ACCOUNT', 'DOCUMENT', 'PROJECT', 'GITHUB', 'LEETCODE', 'PLACEMENT', 'BADGE', 'CERTIFICATE', 'ACHIEVEMENT'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

// Compound index for quick fetching per user in chronological order
timelineEventSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('TimelineEvent', timelineEventSchema);
