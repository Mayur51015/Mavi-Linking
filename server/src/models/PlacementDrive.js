const mongoose = require('mongoose');

const placementDriveSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Placement drive title is required'],
      trim: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    eligibility: {
      department: { type: [String], default: [] },
      minScore: { type: Number, default: 0 },
      batch: { type: [String], default: [] },
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed'],
      default: 'upcoming',
    },
    date: {
      type: Date,
      required: [true, 'Drive date is required'],
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

placementDriveSchema.index({ companyId: 1 });
placementDriveSchema.index({ date: 1 });
placementDriveSchema.index({ status: 1 });

module.exports = mongoose.model('PlacementDrive', placementDriveSchema);
