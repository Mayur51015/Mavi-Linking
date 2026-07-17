const Job = require('../models/Job');
const Company = require('../models/Company');
const User = require('../models/User');
const RecruitmentPipeline = require('../models/RecruitmentPipeline');
const ActivityLog = require('../models/ActivityLog');
const { createNotification } = require('../services/notificationService');

/**
 * @desc    Create a new job opening
 * @route   POST /api/jobs
 * @access  Private (recruiter)
 */
const createJob = async (req, res, next) => {
  try {
    const { title, description, skills, department, graduationYear, experience, package: salary } = req.body;

    let company = await Company.findOne({ recruiterId: req.user.id });
    if (!company) {
      company = await Company.create({
        recruiterId: req.user.id,
        name: req.user.companyName || 'My Company',
      });
    }

    const job = await Job.create({
      recruiterId: req.user.id,
      companyId: company._id,
      title,
      description,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
      department: Array.isArray(department) ? department : (department ? department.split(',').map(d => d.trim()) : []),
      graduationYear: Array.isArray(graduationYear) ? graduationYear : (graduationYear ? graduationYear.split(',').map(y => y.trim()) : []),
      experience,
      package: salary,
    });

    await ActivityLog.create({
      userId: req.user.id,
      action: 'Create Job',
      details: `Created job posting: ${title}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all jobs (public/student view with filters)
 * @route   GET /api/jobs
 * @access  Private (all)
 */
const getAllJobs = async (req, res, next) => {
  try {
    const { search, department, skill } = req.query;
    const query = { status: 'open' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (department) {
      query.department = { $in: [new RegExp(department, 'i')] };
    }
    if (skill) {
      query.skills = { $in: [new RegExp(skill, 'i')] };
    }

    const jobs = await Job.find(query)
      .populate('companyId', 'name logo website industry location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get jobs posted by the logged-in recruiter
 * @route   GET /api/jobs/recruiter
 * @access  Private (recruiter)
 */
const getRecruiterJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ recruiterId: req.user.id })
      .populate('companyId', 'name logo')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get job details & candidates
 * @route   GET /api/jobs/:id
 * @access  Private
 */
const getJobDetails = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('companyId', 'name logo website industry location hrContact');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job opening not found' });
    }

    let candidates = [];
    // If recruiter owns this job, find all candidate pipelines for it
    if (req.user.role === 'recruiter' && job.recruiterId.toString() === req.user.id) {
      candidates = await RecruitmentPipeline.find({
        recruiterId: req.user.id,
        role: job.title,
      }).populate('studentId', 'name username email avatar scores university placementStatus isVerified');
    }

    res.status(200).json({
      success: true,
      data: {
        job,
        candidates,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update job details
 * @route   PUT /api/jobs/:id
 * @access  Private (recruiter)
 */
const updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job opening not found' });
    }

    if (job.recruiterId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { title, description, skills, department, graduationYear, experience, package: salary, status } = req.body;
    const updateFields = {
      title,
      description,
      experience,
      package: salary,
      status,
    };

    if (skills) updateFields.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
    if (department) updateFields.department = Array.isArray(department) ? department : department.split(',').map(d => d.trim());
    if (graduationYear) updateFields.graduationYear = Array.isArray(graduationYear) ? graduationYear : graduationYear.split(',').map(y => y.trim());

    job = await Job.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true, runValidators: true });

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete job opening
 * @route   DELETE /api/jobs/:id
 * @access  Private (recruiter)
 */
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job opening not found' });
    }

    if (job.recruiterId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await job.deleteOne();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'Delete Job',
      details: `Deleted job posting: ${job.title}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Apply to a job
 * @route   POST /api/jobs/:id/apply
 * @access  Private (student)
 */
const applyToJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('companyId');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job opening not found' });
    }

    if (req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Only students can apply to jobs' });
    }

    // Check duplicate applications
    const existing = await RecruitmentPipeline.findOne({
      studentId: req.user.id,
      recruiterId: job.recruiterId,
      role: job.title,
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied for this role.' });
    }

    const company = await Company.findById(job.companyId);

    const pipeline = await RecruitmentPipeline.create({
      studentId: req.user.id,
      recruiterId: job.recruiterId,
      companyId: job.companyId,
      companyName: company?.name || 'Unknown Company',
      role: job.title,
      status: 'Applied',
      timeline: [
        {
          status: 'Applied',
          updatedAt: new Date(),
          updatedBy: req.user.id,
          note: 'Applied through Job Board.',
        },
      ],
    });

    // Update student availability state
    await User.findByIdAndUpdate(req.user.id, {
      $set: { placementStatus: 'Under Review' },
    });

    // Notify Recruiter
    await createNotification({
      recipientId: job.recruiterId,
      senderId: req.user.id,
      type: 'pipeline_started',
      title: 'New Job Application',
      message: `${req.user.name} has applied for "${job.title}".`,
      metadata: { pipelineId: pipeline._id, jobId: job._id },
    });

    // Log Activity
    await ActivityLog.create({
      userId: req.user.id,
      action: 'Apply Job',
      details: `Applied for ${job.title} at ${company?.name || 'Company'}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: pipeline,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJob,
  getAllJobs,
  getRecruiterJobs,
  getJobDetails,
  updateJob,
  deleteJob,
  applyToJob,
};
