const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Job = require('../models/Job');
const User = require('../models/User');
const RecruitmentNotification = require('../models/RecruitmentNotification');

exports.applyForJob = async (req, res, next) => {
  try {
    const { jobId } = req.body;
    const studentId = req.user.id;
    
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    
    const application = await Application.create({
      jobId,
      studentId,
      recruiterId: job.recruiterId,
    });
    
    // Notify recruiter
    await RecruitmentNotification.create({
      recipientId: job.recruiterId,
      senderId: studentId,
      type: 'new_application',
      title: 'New Job Application',
      message: `${req.user.name} applied for ${job.title}`,
      metadata: { applicationId: application._id, jobId }
    });
    
    res.status(201).json({ success: true, data: application });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already applied for this job' });
    }
    next(err);
  }
};

exports.getApplications = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'recruiter') {
      query.recruiterId = req.user.id;
    } else if (req.user.role === 'user') {
      query.studentId = req.user.id;
    }
    
    const applications = await Application.find(query).populate('jobId').populate('studentId', 'name username scores placementStatus university');
    res.status(200).json({ success: true, data: applications });
  } catch (err) {
    next(err);
  }
};

exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, recruiterId: req.user.id },
      { status, notes },
      { new: true }
    );
    
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    
    // Notify student
    await RecruitmentNotification.create({
      recipientId: application.studentId,
      senderId: req.user.id,
      type: 'status_update',
      title: 'Application Status Updated',
      message: `Your application status is now: ${status}`,
      metadata: { applicationId: application._id }
    });
    
    // Update student placement status if needed
    if (status === 'Joined' || status === 'Selected') {
      const job = await Job.findById(application.jobId).populate('companyId');
      await User.findByIdAndUpdate(application.studentId, {
        placementStatus: status === 'Joined' ? 'Placed / Hired' : 'Offer Received',
        placedCompany: job?.companyId?.companyName || 'Unknown Company',
        placedRole: job?.title || 'Unknown Role'
      });
    }
    
    res.status(200).json({ success: true, data: application });
  } catch (err) {
    next(err);
  }
};

exports.scheduleInterview = async (req, res, next) => {
  try {
    const { date, time, type, linkOrLocation, notes } = req.body;
    const application = await Application.findOne({ _id: req.params.id, recruiterId: req.user.id });
    
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    
    const interview = await Interview.create({
      applicationId: application._id,
      studentId: application.studentId,
      recruiterId: req.user.id,
      jobId: application.jobId,
      date,
      time,
      type,
      linkOrLocation,
      notes
    });
    
    application.status = 'Interview Scheduled';
    await application.save();
    
    // Notify student
    await RecruitmentNotification.create({
      recipientId: application.studentId,
      senderId: req.user.id,
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: `An interview has been scheduled for ${date} at ${time}`,
      metadata: { interviewId: interview._id }
    });
    
    res.status(201).json({ success: true, data: interview });
  } catch (err) {
    next(err);
  }
};

exports.getInterviews = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'recruiter') query.recruiterId = req.user.id;
    else if (req.user.role === 'user') query.studentId = req.user.id;
    
    const interviews = await Interview.find(query).populate('jobId').populate('studentId', 'name email');
    res.status(200).json({ success: true, data: interviews });
  } catch (err) {
    next(err);
  }
};
