const mongoose = require('mongoose');

const teacherAnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
    },
    teacherId: {
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

teacherAnnouncementSchema.index({ college: 1, department: 1, createdAt: -1 });

module.exports = mongoose.model('TeacherAnnouncement', teacherAnnouncementSchema);
