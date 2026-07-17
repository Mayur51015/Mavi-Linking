const express = require('express');
const { protect } = require('../middleware/auth');
const TeacherAnnouncement = require('../models/TeacherAnnouncement');

const router = express.Router();

/**
 * @desc    Get announcements for the logged-in user's college
 * @route   GET /api/announcements/my-college
 * @access  Private (any role — students, teachers, recruiters)
 */
router.get('/my-college', protect, async (req, res, next) => {
  try {
    const college = req.user.university?.name || '';
    const department = req.user.university?.department || '';
    const query = {};

    // Scope by college if available, otherwise return all
    if (college) query.college = college;

    const announcements = await TeacherAnnouncement.find(query)
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
