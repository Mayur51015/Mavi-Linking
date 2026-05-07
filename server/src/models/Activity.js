const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: { 
      type: String, 
      enum: ['Commit', 'Repository', 'Pull Request', 'Contest', 'Milestone', 'Other'],
      required: true 
    },
    title: { type: String, required: true },
    description: { type: String },
    url: { type: String },
    platform: { type: String, default: 'system' }, // github, leetcode, system
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

activitySchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Activity', activitySchema);
