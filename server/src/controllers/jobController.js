const Job = require('../models/Job');
const Company = require('../models/Company');
const User = require('../models/User');
const RecruitmentPipeline = require('../models/RecruitmentPipeline');
const ActivityLog = require('../models/ActivityLog');
const { createNotification } = require('../services/notificationService');

/**
 * Safely emit socket event if socket.io is initialized
 */
const safeEmit = (room, event, data) => {
  try {
    const { getIO } = require('../config/socket');
    const io = getIO();
    if (io) {
      if (room) {
        io.to(room.toString()).emit(event, data);
      } else {
        io.emit(event, data);
      }
    }
  } catch (err) {
    // Socket not initialized or testing — silently ignore
  }
};

/**
 * @desc    Create a new job opening / opportunity
 * @route   POST /api/jobs or POST /api/opportunities
 * @access  Private (recruiter, admin)
 */
const createJob = async (req, res, next) => {
  try {
    const {
      title,
      description,
      skills,
      department,
      graduationYear,
      experience,
      package: salary,
      type,
      workMode,
      location,
      stipend,
      responsibilities,
      eligibility,
      deadline,
      status,
    } = req.body;

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
      type: type || 'Full-time',
      workMode: workMode || 'On-site',
      location: location || (company.location || 'Flexible'),
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
      department: Array.isArray(department) ? department : (department ? department.split(',').map(d => d.trim()) : []),
      graduationYear: Array.isArray(graduationYear) ? graduationYear : (graduationYear ? graduationYear.split(',').map(y => y.trim()) : []),
      experience: experience || 'Fresher',
      package: salary || '',
      stipend: stipend || '',
      responsibilities: responsibilities || '',
      eligibility: eligibility || '',
      deadline: deadline ? new Date(deadline) : null,
      status: status || 'open',
    });

    await ActivityLog.create({
      userId: req.user.id,
      action: 'Create Job',
      details: `Created opportunity posting: ${title}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    // Notify connected students of new live opportunity
    safeEmit(null, 'job_updated', { action: 'created', job });

    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all active/published opportunities (with search, filter, pagination, match scoring, and application status)
 * @route   GET /api/jobs or GET /api/opportunities
 * @access  Private (all)
 */
const getAllJobs = async (req, res, next) => {
  try {
    const {
      search,
      department,
      skill,
      type,
      workMode,
      location,
      experience,
      sort = 'latest',
      page = 1,
      limit = 20,
    } = req.query;

    const now = new Date();
    // Only published/open opportunities whose deadline has not expired (or deadline is null)
    const query = {
      status: 'open',
      $or: [
        { deadline: null },
        { deadline: { $gte: now } },
      ],
    };

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { skills: { $in: [searchRegex] } },
          { location: searchRegex },
        ],
      });
    }

    if (type && type !== 'all') {
      query.type = new RegExp(`^${type.trim()}$`, 'i');
    }

    if (workMode && workMode !== 'all') {
      query.workMode = new RegExp(`^${workMode.trim()}$`, 'i');
    }

    if (location && location !== 'all') {
      query.location = { $regex: location.trim(), $options: 'i' };
    }

    if (department && department !== 'all') {
      query.department = { $in: [new RegExp(department.trim(), 'i')] };
    }

    if (skill) {
      query.skills = { $in: [new RegExp(skill.trim(), 'i')] };
    }

    if (experience && experience !== 'all') {
      query.experience = { $regex: experience.trim(), $options: 'i' };
    }

    // Determine sorting order
    let sortOptions = { createdAt: -1 };
    if (sort === 'deadline') {
      sortOptions = { deadline: 1, createdAt: -1 };
    } else if (sort === 'salary') {
      sortOptions = { package: -1, stipend: -1, createdAt: -1 };
    }

    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const skip = (parsedPage - 1) * parsedLimit;

    const [total, rawJobs] = await Promise.all([
      Job.countDocuments(query),
      Job.find(query)
        .populate('companyId', 'name logo website industry location')
        .sort(sortOptions)
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
    ]);

    // Gather application state for the logged in user if they are a student
    let userApplicationsByJobId = new Map();
    let userApplicationsByRole = new Map();
    let userSkills = [];

    if (req.user && req.user.role === 'user') {
      const studentApplications = await RecruitmentPipeline.find({
        studentId: req.user.id,
      })
        .select('jobId role status updatedAt createdAt')
        .lean();

      for (const app of studentApplications) {
        if (app.jobId) {
          userApplicationsByJobId.set(app.jobId.toString(), app);
        }
        if (app.role) {
          userApplicationsByRole.set(app.role.toLowerCase().trim(), app);
        }
      }

      const currentUser = await User.findById(req.user.id).select('skillsList developerSkills').lean();
      const combined = [
        ...(currentUser?.skillsList || []),
        ...(currentUser?.developerSkills || []),
      ];
      userSkills = combined
        .map(s => (typeof s === 'string' ? s : s?.name || '').toLowerCase().trim())
        .filter(Boolean);
    }

    // Enrich jobs with application status, deterministic match score, and applicants count
    const enrichedJobs = await Promise.all(
      rawJobs.map(async (job) => {
        const jobIdStr = job._id.toString();
        const roleKey = job.title?.toLowerCase().trim();

        const userApp = userApplicationsByJobId.get(jobIdStr) || userApplicationsByRole.get(roleKey);
        const hasApplied = Boolean(userApp);
        const applicationStatus = userApp ? userApp.status : null;
        const applicationId = userApp ? userApp._id : null;

        // Deterministic Career Match calculation
        let matchScore = 0;
        if (userSkills.length > 0 && Array.isArray(job.skills) && job.skills.length > 0) {
          const userSkillSet = new Set(userSkills);
          const matchedSkills = job.skills.filter(s => userSkillSet.has(s.toLowerCase().trim()));
          matchScore = Math.round((matchedSkills.length / job.skills.length) * 100);
        }

        // Count applicants for this opportunity
        const applicantsCount = await RecruitmentPipeline.countDocuments({
          $or: [
            { jobId: job._id },
            { recruiterId: job.recruiterId, role: job.title },
          ],
        });

        return {
          ...job,
          hasApplied,
          applicationStatus,
          applicationId,
          matchScore,
          applicantsCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedJobs.length,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit) || 1,
      },
      data: enrichedJobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get jobs posted by the logged-in recruiter
 * @route   GET /api/jobs/recruiter
 * @access  Private (recruiter, admin)
 */
const getRecruiterJobs = async (req, res, next) => {
  try {
    const rawJobs = await Job.find({ recruiterId: req.user.id })
      .populate('companyId', 'name logo location industry')
      .sort({ createdAt: -1 })
      .lean();

    const jobsWithStats = await Promise.all(
      rawJobs.map(async (job) => {
        const applicantsCount = await RecruitmentPipeline.countDocuments({
          $or: [
            { jobId: job._id },
            { recruiterId: req.user.id, role: job.title },
          ],
        });
        return {
          ...job,
          applicantsCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: jobsWithStats.length,
      data: jobsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get opportunity details & candidates
 * @route   GET /api/jobs/:id
 * @access  Private (all)
 */
const getJobDetails = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('companyId', 'name logo website industry location hrContact');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    let candidates = [];
    // If recruiter owns this job, find all candidate pipelines for it
    if (req.user.role === 'recruiter' && job.recruiterId.toString() === req.user.id) {
      candidates = await RecruitmentPipeline.find({
        $or: [
          { jobId: job._id },
          { recruiterId: req.user.id, role: job.title },
        ],
      })
        .populate('studentId', 'name username email avatar scores university placementStatus isVerified')
        .sort({ updatedAt: -1 });
    }

    // If student, check if already applied
    let application = null;
    if (req.user.role === 'user') {
      application = await RecruitmentPipeline.findOne({
        studentId: req.user.id,
        $or: [
          { jobId: job._id },
          { recruiterId: job.recruiterId, role: job.title },
        ],
      }).lean();
    }

    const applicantsCount = await RecruitmentPipeline.countDocuments({
      $or: [
        { jobId: job._id },
        { recruiterId: job.recruiterId, role: job.title },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        job: {
          ...job.toObject(),
          hasApplied: Boolean(application),
          applicationStatus: application ? application.status : null,
          applicationId: application ? application._id : null,
          applicantsCount,
        },
        candidates,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update opportunity details
 * @route   PUT /api/jobs/:id
 * @access  Private (recruiter, admin)
 */
const updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    if (job.recruiterId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const {
      title,
      description,
      skills,
      department,
      graduationYear,
      experience,
      package: salary,
      type,
      workMode,
      location,
      stipend,
      responsibilities,
      eligibility,
      deadline,
      status,
    } = req.body;

    const updateFields = {
      title,
      description,
      experience,
      package: salary,
      stipend,
      responsibilities,
      eligibility,
      status,
    };

    if (type) updateFields.type = type;
    if (workMode) updateFields.workMode = workMode;
    if (location !== undefined) updateFields.location = location;
    if (deadline !== undefined) updateFields.deadline = deadline ? new Date(deadline) : null;
    if (skills) updateFields.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
    if (department) updateFields.department = Array.isArray(department) ? department : department.split(',').map(d => d.trim());
    if (graduationYear) updateFields.graduationYear = Array.isArray(graduationYear) ? graduationYear : graduationYear.split(',').map(y => y.trim());

    job = await Job.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true, runValidators: true });

    safeEmit(null, 'job_updated', { action: 'updated', job });

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
 * @access  Private (recruiter, admin)
 */
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    if (job.recruiterId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await job.deleteOne();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'Delete Job',
      details: `Deleted opportunity posting: ${job.title}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    safeEmit(null, 'job_updated', { action: 'deleted', jobId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Opportunity deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Apply to an opportunity
 * @route   POST /api/jobs/:id/apply
 * @access  Private (student)
 */
const applyToJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('companyId');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Opportunity not found.' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ success: false, message: 'This opportunity is no longer accepting applications.' });
    }

    // Check application deadline
    if (job.deadline && new Date(job.deadline) < new Date()) {
      return res.status(400).json({ success: false, message: 'The application deadline has passed.' });
    }

    if (req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Only students can apply to opportunities.' });
    }

    // Check duplicate applications (by jobId or studentId+recruiterId+role)
    const existing = await RecruitmentPipeline.findOne({
      studentId: req.user.id,
      $or: [
        { jobId: job._id },
        { recruiterId: job.recruiterId, role: job.title },
      ],
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied for this opportunity.' });
    }

    const company = await Company.findById(job.companyId);

    const pipeline = await RecruitmentPipeline.create({
      studentId: req.user.id,
      recruiterId: job.recruiterId,
      companyId: job.companyId,
      jobId: job._id,
      companyName: company?.name || 'Company',
      role: job.title,
      status: 'Applied',
      timeline: [
        {
          status: 'Applied',
          updatedAt: new Date(),
          updatedBy: req.user.id,
          note: 'Applied through Career Opportunities Dashboard.',
        },
      ],
    });

    // Update student placement status
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
      metadata: { pipelineId: pipeline._id, jobId: job._id, role: job.title },
    });

    // Notify Student
    await createNotification({
      recipientId: req.user.id,
      senderId: job.recruiterId,
      type: 'status_update',
      title: 'Application Submitted',
      message: `Your application for "${job.title}" at ${company?.name || 'Company'} was submitted successfully.`,
      metadata: { pipelineId: pipeline._id, jobId: job._id, role: job.title },
    });

    // Log Activity
    await ActivityLog.create({
      userId: req.user.id,
      action: 'Apply Job',
      details: `Applied for ${job.title} at ${company?.name || 'Company'}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    // Real-time Socket.IO emission to both recruiter and student rooms
    safeEmit(job.recruiterId, 'pipeline_update', {
      action: 'new_application',
      pipeline,
    });
    safeEmit(req.user.id, 'pipeline_update', {
      action: 'application_submitted',
      pipeline,
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
