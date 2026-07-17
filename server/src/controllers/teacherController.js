const teacherService = require('../services/teacherService');

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

const PlacementDrive = require('../models/PlacementDrive');
const User = require('../models/User');
const RecruitmentNotification = require('../models/RecruitmentNotification');

/**
 * @desc    Create a placement drive
 * @route   POST /api/teacher/drives
 * @access  Private (teacher)
 */
const createPlacementDrive = async (req, res, next) => {
  try {
    const drive = await PlacementDrive.create({
      ...req.body,
      teacherId: req.user.id
    });
    res.status(201).json({ success: true, data: drive });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get placement drives
 * @route   GET /api/teacher/drives
 * @access  Private (teacher)
 */
const getPlacementDrives = async (req, res, next) => {
  try {
    const drives = await PlacementDrive.find({ teacherId: req.user.id }).populate('assignedStudents', 'name email scores');
    res.status(200).json({ success: true, data: drives });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify a student
 * @route   PUT /api/teacher/students/:studentId/verify
 * @access  Private (teacher)
 */
const verifyStudent = async (req, res, next) => {
  try {
    const student = await User.findByIdAndUpdate(
      req.params.studentId,
      { isVerified: true },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    await RecruitmentNotification.create({
      recipientId: student._id,
      senderId: req.user.id,
      type: 'general',
      title: 'Profile Verified',
      message: 'Your profile has been verified by your teacher.',
    });
    
    res.status(200).json({ success: true, data: student });
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
  createPlacementDrive,
  getPlacementDrives,
  verifyStudent
};
