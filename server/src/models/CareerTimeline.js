const mongoose = require('mongoose');

const careerTimelineSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true }, // e.g. 'PROFILE_CREATE', 'RESUME_UPLOAD', 'CERTIFICATE_ADD', etc.
  title: { type: String, required: true },
  description: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('CareerTimeline', careerTimelineSchema);
