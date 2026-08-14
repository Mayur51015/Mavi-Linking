const User = require('../models/User');
const Department = require('../models/Department');
const TeacherAnnouncement = require('../models/TeacherAnnouncement');

/**
 * @desc    Get department-scoped dashboard metrics for logged-in Department Admin
 * @route   GET /api/department-admin/dashboard
 * @access  Private (Department Admin, Institution Admin, Super Admin)
 */
const getDepartmentDashboard = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const departmentId = req.user.departmentId;

    let deptQuery = {};
    if (departmentId) {
      deptQuery = { departmentId };
    } else if (institutionId) {
      deptQuery = { institutionId };
    }

    const department = departmentId ? await Department.findById(departmentId).populate('institutionId', 'name code tenantId') : null;

    const [studentsCount, teachersCount, announcements] = await Promise.all([
      User.countDocuments({ ...deptQuery, role: 'user' }),
      User.countDocuments({ ...deptQuery, role: 'teacher' }),
      TeacherAnnouncement.find(deptQuery).sort({ createdAt: -1 }).limit(5),
    ]);

    res.status(200).json({
      success: true,
      data: {
        departmentName: department?.name || req.user.university?.department || 'Department Administration',
        departmentCode: department?.code || '',
        institutionName: department?.institutionId?.name || req.user.university?.name || '',
        tenantId: req.user.tenantId,
        metrics: {
          students: studentsCount,
          teachers: teachersCount,
          announcementsCount: announcements.length,
        },
        announcements,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated student directory strictly for assigned department
 * @route   GET /api/department-admin/students
 * @access  Private (Department Admin)
 */
const getDepartmentStudents = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const query = { role: 'user' };
    if (req.user.departmentId) {
      query.departmentId = req.user.departmentId;
    } else if (req.user.institutionId) {
      query.institutionId = req.user.institutionId;
    }

    if (search) {
      const clean = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: clean, $options: 'i' } },
        { email: { $regex: clean, $options: 'i' } },
        { maviId: { $regex: clean, $options: 'i' } },
        { prn: { $regex: clean, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [students, total] = await Promise.all([
      User.find(query)
        .select('name email maviId prn avatar university scores status accountStatus createdAt')
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        students,
        pagination: {
          total,
          page: parseInt(page, 10),
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get teacher list strictly for assigned department
 * @route   GET /api/department-admin/teachers
 * @access  Private (Department Admin)
 */
const getDepartmentTeachers = async (req, res, next) => {
  try {
    const query = { role: 'teacher' };
    if (req.user.departmentId) {
      query.departmentId = req.user.departmentId;
    } else if (req.user.institutionId) {
      query.institutionId = req.user.institutionId;
    }

    const teachers = await User.find(query)
      .select('name email maviId designation status avatar createdAt')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartmentDashboard,
  getDepartmentStudents,
  getDepartmentTeachers,
};
