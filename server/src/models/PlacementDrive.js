const mongoose = require('mongoose');

const placementDriveSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyName: {
      type: String,
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
    date: {
      type: Date,
      required: true,
    },
    eligibleDepartments: [{ type: String }],
    eligibleBatches: [{ type: String }],
    minScore: { type: Number, default: 0 },
    assignedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    status: {
      type: String,
      enum: ['Upcoming', 'Ongoing', 'Completed'],
      default: 'Upcoming',
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlacementDrive', placementDriveSchema);
