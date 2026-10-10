const Project = require('../models/Project');
const {
  STORAGE_BUCKETS,
  validateFile,
  generateStoragePath,
} = require('../utils/fileValidation');
const {
  getPublicUrl,
  replaceFile,
  deleteFile,
  cleanupOrphan,
} = require('../services/supabaseStorageService');

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

    // Log timeline event
    const { logTimelineEvent } = require('../utils/timelineLogger');
    await logTimelineEvent(
      req.user.id,
      'PROJECT',
      `Updated Project: ${project.title}`,
      project.description ? (project.description.substring(0, 50) + '...') : '',
      { projectId: project._id }
    );

    // Re-evaluate intelligence asynchronously
    const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');
    evaluateUserIntelligence(req.user.id).catch(err => console.error('AI Eval Error:', err));

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

    const deletedTitle = project.title;
    if (project.storagePath) {
      await deleteFile(STORAGE_BUCKETS.PROJECT_ASSETS, project.storagePath);
    }
    await project.deleteOne();

    // Log timeline event
    const { logTimelineEvent } = require('../utils/timelineLogger');
    await logTimelineEvent(
      req.user.id,
      'PROJECT',
      `Removed Project: ${deletedTitle}`,
      ''
    );

    // Re-evaluate intelligence asynchronously
    const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');
    evaluateUserIntelligence(req.user.id).catch(err => console.error('AI Eval Error:', err));

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload project screenshot / showcase asset
 * @route   POST /api/projects/:id/screenshot
 * @access  Private (Owner or Admin)
 */
const uploadProjectScreenshot = async (req, res, next) => {
  let uploadedStoragePath = null;
  const bucket = STORAGE_BUCKETS.PROJECT_ASSETS;

  try {
    const file = req.file || (req.files && (req.files.screenshot?.[0] || req.files.file?.[0]));
    if (!file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (project.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this project.' });
    }

    const validation = validateFile(file, bucket);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    uploadedStoragePath = generateStoragePath('projects', project._id.toString(), file.originalname);

    const oldStoragePath = project.storagePath;
    const uploadResult = await replaceFile({
      bucket,
      oldPath: oldStoragePath,
      newPath: uploadedStoragePath,
      buffer: file.buffer,
      mimeType: file.mimetype,
    });

    if (!uploadResult.success) {
      return res.status(502).json({
        success: false,
        message: `Failed to upload screenshot to storage: ${uploadResult.error}`,
      });
    }

    const publicUrl = getPublicUrl(bucket, uploadedStoragePath);
    project.screenshot = publicUrl;
    project.storagePath = uploadedStoragePath;
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Project screenshot uploaded successfully.',
      data: {
        screenshot: publicUrl,
        storagePath: uploadedStoragePath,
        project,
      },
    });
  } catch (error) {
    if (uploadedStoragePath) {
      await cleanupOrphan({ bucket, objectPath: uploadedStoragePath });
    }
    next(error);
  }
};

module.exports = {
  createProject,
  getMyProjects,
  updateProject,
  deleteProject,
  uploadProjectScreenshot,
};

