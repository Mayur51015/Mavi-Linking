const placementService = require('../services/placementService');

/**
 * @desc    Create a new recruitment pipeline
 * @route   POST /api/placement/pipeline
 * @access  Private (recruiter)
 */
const createPipeline = async (req, res, next) => {
  try {
    const pipeline = await placementService.createPipeline(req.user.id, req.body);
    res.status(201).json({ success: true, data: pipeline });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update pipeline status
 * @route   PUT /api/placement/pipeline/:id/status
 * @access  Private (recruiter)
 */
const updatePipelineStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const pipeline = await placementService.updatePipelineStatus(
      req.params.id, status, req.user.id, note
    );
    res.status(200).json({ success: true, data: pipeline });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update interview details
 * @route   PUT /api/placement/pipeline/:id/interview
 * @access  Private (recruiter)
 */
const updateInterviewDetails = async (req, res, next) => {
  try {
    const pipeline = await placementService.updateInterviewDetails(
      req.params.id, req.body, req.user.id
    );
    res.status(200).json({ success: true, data: pipeline });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update offer details
 * @route   PUT /api/placement/pipeline/:id/offer
 * @access  Private (recruiter)
 */
const updateOfferDetails = async (req, res, next) => {
  try {
    const pipeline = await placementService.updateOfferDetails(
      req.params.id, req.body, req.user.id
    );
    res.status(200).json({ success: true, data: pipeline });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recruiter's pipelines
 * @route   GET /api/placement/pipeline
 * @access  Private (recruiter)
 */
const getRecruiterPipelines = async (req, res, next) => {
  try {
    const pipelines = await placementService.getRecruiterPipelines(
      req.user.id, req.query.status
    );
    res.status(200).json({ success: true, data: pipelines });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student's pipelines
 * @route   GET /api/placement/student/pipelines
 * @access  Private (user)
 */
const getStudentPipelines = async (req, res, next) => {
  try {
    const pipelines = await placementService.getStudentPipelines(req.user.id);
    res.status(200).json({ success: true, data: pipelines });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single pipeline
 * @route   GET /api/placement/pipeline/:id
 * @access  Private (recruiter, user)
 */
const getPipelineById = async (req, res, next) => {
  try {
    const pipeline = await placementService.getPipelineById(req.params.id);
    if (!pipeline) {
      return res.status(404).json({ success: false, message: 'Pipeline not found.' });
    }
    // Verify access: must be the recruiter or the student
    const userId = req.user.id;
    if (
      pipeline.recruiterId._id.toString() !== userId &&
      pipeline.studentId._id.toString() !== userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    res.status(200).json({ success: true, data: pipeline });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get pipeline stats for recruiter
 * @route   GET /api/placement/stats
 * @access  Private (recruiter)
 */
const getPipelineStats = async (req, res, next) => {
  try {
    const stats = await placementService.getRecruiterPipelineStats(req.user.id);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update student availability
 * @route   PUT /api/placement/availability
 * @access  Private (user)
 */
const updateAvailability = async (req, res, next) => {
  try {
    const result = await placementService.updateAvailability(req.user.id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student availability
 * @route   GET /api/placement/availability
 * @access  Private (user)
 */
const getAvailability = async (req, res, next) => {
  try {
    const result = await placementService.getAvailability(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPipeline,
  updatePipelineStatus,
  updateInterviewDetails,
  updateOfferDetails,
  getRecruiterPipelines,
  getStudentPipelines,
  getPipelineById,
  getPipelineStats,
  updateAvailability,
  getAvailability,
};
