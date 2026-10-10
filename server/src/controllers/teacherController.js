const mongoose = require('mongoose');
const teacherService = require('../services/teacherService');
const PlacementDrive = require('../models/PlacementDrive');
const TeacherAnnouncement = require('../models/TeacherAnnouncement');
const Company = require('../models/Company');
const ActivityLog = require('../models/ActivityLog');

/**
 * @desc    Get students from teacher's own college + department
 * @route   GET /api/teacher/students
 * @access  Private (teacher)
 */
const getMyStudents = async (req, res, next) => {
  try {
    const { batch, page, limit, sortBy } = req.query;
    const result = await teacherService.getStudentsForTeacher(req.user, {
      batch, page, limit, sortBy,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed student profile (within teacher's scope)
 * @route   GET /api/teacher/students/:studentId
 * @access  Private (teacher)
 */
const getStudentDetail = async (req, res, next) => {
  try {
    const student = await teacherService.getStudentDetail(req.user, req.params.studentId);
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get placement readiness for teacher's department
 * @route   GET /api/teacher/readiness
 * @access  Private (teacher)
 */
const getReadiness = async (req, res, next) => {
  try {
    const result = await teacherService.getPlacementReadiness(req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get department leaderboard
 * @route   GET /api/teacher/leaderboard
 * @access  Private (teacher)
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const leaderboard = await teacherService.getDepartmentLeaderboard(req.user, limit);
    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get department stats overview
 * @route   GET /api/teacher/stats
 * @access  Private (teacher)
 */
const getDepartmentStats = async (req, res, next) => {
  try {
    const stats = await teacherService.getDepartmentStats(req.user);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve/verify student profile items
 * @route   PUT /api/teacher/verify/:studentId/:itemType/:itemId
 * @access  Private (teacher)
 */
const verifyStudentItem = async (req, res, next) => {
  try {
    const { studentId, itemType, itemId } = req.params;
    const result = await teacherService.verifyStudentItem(studentId, itemType, itemId, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Recommend a student to recruiter
 * @route   POST /api/teacher/recommend/:studentId/:recruiterId
 * @access  Private (teacher)
 */
const recommendStudent = async (req, res, next) => {
  try {
    const { studentId, recruiterId } = req.params;
    const result = await teacherService.recommendStudent(studentId, recruiterId, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get comparative batch statistics
 * @route   GET /api/teacher/batch-analytics
 * @access  Private (teacher)
 */
const getBatchAnalytics = async (req, res, next) => {
  try {
    const analytics = await teacherService.getBatchAnalytics(req.user);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export placement report PDF
 * @route   GET /api/teacher/reports/export
 * @access  Private (teacher)
 */
const exportPdfReport = async (req, res, next) => {
  try {
    const { type = 'department' } = req.query;
    const doc = await teacherService.generatePdfReport(req.user, type);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=placement_report_${type}.pdf`);
    doc.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get mentoring alerts
 * @route   GET /api/teacher/mentoring-alerts
 * @access  Private (teacher)
 */
const getMentoringAlerts = async (req, res, next) => {
  try {
    const alerts = await teacherService.getMentoringAlerts(req.user);
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    next(error);
  }
};

// ─── Placement Drives CRUD ──────────────────────────────────────────────────

/**
 * @desc    Get registered companies for placement drives
 * @route   GET /api/teacher/companies
 * @access  Private (teacher, admin)
 */
const getTeacherCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find()
      .select('name logo website location industry hrContact')
      .sort({ name: 1 });
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    next(error);
  }
};

const createPlacementDrive = async (req, res, next) => {
  try {
    const { title, companyId, description, eligibility, date } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Drive title is required.',
      });
    }

    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid company from the list.',
      });
    }

    const companyExists = await Company.findById(companyId);
    if (!companyExists) {
      return res.status(400).json({
        success: false,
        message: 'The selected company does not exist in the database.',
      });
    }

    if (!date || isNaN(new Date(date).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid drive date.',
      });
    }

    // Normalize departments and eligibility
    const rawDepts = eligibility?.departments || eligibility?.department || [];
    const departments = Array.isArray(rawDepts)
      ? rawDepts.map((d) => String(d).trim()).filter(Boolean)
      : (typeof rawDepts === 'string' ? rawDepts.split(',').map((d) => d.trim()).filter(Boolean) : []);

    const minScore = typeof eligibility?.minScore === 'number'
      ? eligibility.minScore
      : (Number(eligibility?.minScore) || 0);

    const batch = Array.isArray(eligibility?.batch)
      ? eligibility.batch
      : (typeof eligibility?.batch === 'string' ? eligibility.batch.split(',').map((b) => b.trim()).filter(Boolean) : []);

    const normalizedEligibility = {
      department: departments,
      departments,
      minScore,
      batch,
    };

    const drive = await PlacementDrive.create({
      title: title.trim(),
      companyId,
      description: description || '',
      eligibility: normalizedEligibility,
      date,
      createdBy: req.user.id,
    });

    const populatedDrive = await PlacementDrive.findById(drive._id)
      .populate('companyId', 'name logo website location')
      .populate('students', 'name email scores university placementStatus');

    res.status(201).json({ success: true, data: populatedDrive || drive });
  } catch (error) {
    next(error);
  }
};

const getPlacementDrives = async (req, res, next) => {
  try {
    const drives = await PlacementDrive.find()
      .populate('companyId', 'name logo website location')
      .populate('students', 'name email scores university placementStatus')
      .sort({ date: 1 });
    res.status(200).json({ success: true, data: drives });
  } catch (error) {
    next(error);
  }
};

const updatePlacementDrive = async (req, res, next) => {
  try {
    const drive = await PlacementDrive.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: drive });
  } catch (error) {
    next(error);
  }
};

const deletePlacementDrive = async (req, res, next) => {
  try {
    await PlacementDrive.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Drive deleted' });
  } catch (error) {
    next(error);
  }
};

const assignStudentsToDrive = async (req, res, next) => {
  try {
    const { studentIds } = req.body;
    const drive = await PlacementDrive.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { students: { $each: studentIds } } },
      { new: true }
    ).populate('companyId', 'name');

    if (!drive) {
      return res.status(404).json({ success: false, message: 'Placement drive not found' });
    }

    // Resolve assigned students server-side and dispatch assignment notification email to each student
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      const User = require('../models/User');
      const { sendAssignmentNotificationEmail } = require('../utils/sendEmail');
      const { createNotification } = require('../services/notificationService');

      const assignedStudents = await User.find({ _id: { $in: studentIds } }).select('email name');

      for (const student of assignedStudents) {
        if (student && student.email) {
          sendAssignmentNotificationEmail({
            to: student.email,
            recipientUserId: student._id,
            actorUserId: req.user._id,
            actorName: req.user.name || 'Faculty Instructor',
            actorRole: 'Teacher',
            assignmentTitle: `Assigned to Placement Drive: ${drive.title}`,
            assignmentDetails: `You have been nominated and assigned to the ${drive.title} placement drive with ${drive.companyId?.name || 'participating company'}.`,
            assignmentType: 'PLACEMENT_DRIVE_ASSIGNMENT',
            dueDate: drive.date,
          }).catch((err) => console.error(`[DRIVE ASSIGN EMAIL ERROR] ${student.email}:`, err.message));

          createNotification({
            recipientId: student._id,
            senderId: req.user._id,
            type: 'pipeline_started',
            title: `Assigned to Placement Drive: ${drive.title}`,
            message: `Your instructor ${req.user.name} has assigned you to the ${drive.title} drive.`,
          }).catch(() => {});
        }
      }
    }

    res.status(200).json({ success: true, data: drive });
  } catch (error) {
    next(error);
  }
};

// ─── Announcements CRUD ─────────────────────────────────────────────────────

const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, department } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    let targetDept = department || '';
    if (req.user.role !== 'admin' && req.user.university?.department) {
      const allowedDepts = req.user.university.department.split(',').map(d => d.trim()).filter(Boolean);
      if (targetDept && targetDept !== 'All' && !allowedDepts.includes(targetDept)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid department. Allowed departments: ${allowedDepts.join(', ')}` 
        });
      }
      if (!targetDept) {
        targetDept = allowedDepts[0] || 'All';
      }
    } else if (!targetDept) {
      targetDept = 'All';
    }

    const ann = await TeacherAnnouncement.create({
      title,
      content,
      teacherId: req.user.id,
      college: req.user.university?.name || '',
      department: targetDept,
    });
    res.status(201).json({ success: true, data: ann });
  } catch (error) {
    next(error);
  }
};

const getAnnouncements = async (req, res, next) => {
  try {
    const college = req.user.university?.name || '';
    const department = req.user.university?.department || '';
    const { search, page = 1, limit = 10, departmentFilter } = req.query;

    const query = {};
    if (college) query.college = college;
    
    // Default to teacher's departments, but allow filtering
    const teacherDepts = department.split(',').map(d => d.trim()).filter(Boolean);
    if (departmentFilter) {
      query.department = departmentFilter;
    } else {
      query.department = { $in: [...teacherDepts, 'All', ''] };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await TeacherAnnouncement.countDocuments(query);

    const anns = await TeacherAnnouncement.find(query)
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: anns,
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
};

const updateAnnouncement = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const ann = await TeacherAnnouncement.findById(req.params.id);
    if (!ann) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    // Permission check
    if (req.user.role !== 'admin' && ann.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only edit your own announcements.' });
    }

    if (title) ann.title = title;
    if (content) ann.content = content;

    await ann.save();
    res.status(200).json({ success: true, data: ann });
  } catch (error) {
    next(error);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const ann = await TeacherAnnouncement.findById(req.params.id);
    if (!ann) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    // Permission check
    if (req.user.role !== 'admin' && ann.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only delete your own announcements.' });
    }

    await TeacherAnnouncement.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyStudents,
  getStudentDetail,
  getReadiness,
  getLeaderboard,
  getDepartmentStats,
  verifyStudentItem,
  recommendStudent,
  getBatchAnalytics,
  exportPdfReport,
  getTeacherCompanies,
  createPlacementDrive,
  getPlacementDrives,
  updatePlacementDrive,
  deletePlacementDrive,
  assignStudentsToDrive,
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  getMentoringAlerts,
};
