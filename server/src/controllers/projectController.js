const Project = require('../models/Project');

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
const createProject = async (req, res, next) => {
  try {
    const { title, description, technologies, githubUrl, liveUrl, featured } = req.body;

    const project = await Project.create({
      user: req.user.id,
      title,
      description,
      technologies,
      githubUrl,
      liveUrl,
      featured,
    });

    // Log timeline event
    const { logTimelineEvent } = require('../utils/timelineLogger');
    await logTimelineEvent(
      req.user.id,
      'PROJECT',
      `Added New Project: ${title}`,
      description.substring(0, 50) + '...',
      { projectId: project._id }
    );

    // Re-evaluate intelligence asynchronously
    const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');
    evaluateUserIntelligence(req.user.id).catch(err => console.error('AI Eval Error:', err));

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all projects for the logged-in user
 * @route   GET /api/projects
 * @access  Private
 */
const getMyProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
const updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Ensure user owns project
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this project' });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a project
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Ensure user owns project
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this project' });
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getMyProjects,
  updateProject,
  deleteProject,
};
