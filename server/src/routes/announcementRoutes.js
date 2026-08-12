const express = require('express');
const { protect } = require('../middleware/auth');
const TeacherAnnouncement = require('../models/TeacherAnnouncement');
const { buildSearchFilter, parsePagination, totalPages } = require('../utils/queryHelpers');

const router = express.Router();

/**
 * @desc    Get announcements for the logged-in user's college
 * @route   GET /api/announcements/my-college
 * @access  Private (any role — students, teachers, recruiters)
 */
router.get('/my-college', protect, async (req, res, next) => {
  try {
    const college = req.user.university?.name || '';
    const { search, departmentFilter } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const query = {};

    // Scope by college if available
    if (college) query.college = college;

    if (departmentFilter) {
      query.department = departmentFilter;
    }

    const searchFilter = buildSearchFilter(search, ['title', 'content']);
    if (searchFilter) {
      Object.assign(query, searchFilter);
    }

    const total = await TeacherAnnouncement.countDocuments(query);

    const announcements = await TeacherAnnouncement.find(query)
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: announcements,
      pagination: {
        total,
        page,
        limit,
        pages: totalPages(total, limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
