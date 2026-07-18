const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    technologies: {
      type: [String],
      required: [true, 'At least one technology is required'],
    },
    githubUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?github\.com\/.+$/, 'Please provide a valid GitHub URL'],
    },
    liveUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+$/, 'Please provide a valid URL'],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    views: { type: Number, default: 0 },
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    contributors: { type: Number, default: 1 },
    complexityScore: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Prevent users from adding too many projects (e.g., max 20 per user)
projectSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Project').countDocuments({ user: this.user });
    if (count >= 20) {
      throw new Error('Maximum limit of 20 projects reached');
    }
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
