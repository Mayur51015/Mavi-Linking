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
    const { search, page = 1, limit = 10, departmentFilter } = req.query;
    const query = {};

    // Scope by college if available
    if (college) query.college = college;

    if (departmentFilter) {
      query.department = departmentFilter;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await TeacherAnnouncement.countDocuments(query);

    const announcements = await TeacherAnnouncement.find(query)
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: announcements,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
