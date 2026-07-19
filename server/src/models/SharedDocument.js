const mongoose = require('mongoose');

const sharedDocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    college: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

sharedDocumentSchema.index({ college: 1, department: 1, createdAt: -1 });

module.exports = mongoose.model('SharedDocument', sharedDocumentSchema);
