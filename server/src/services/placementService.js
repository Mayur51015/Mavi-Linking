const RecruitmentPipeline = require('../models/RecruitmentPipeline');
const RecruitmentNotification = require('../models/RecruitmentNotification');
const User = require('../models/User');

// Status transition map — defines which transitions are legal
const VALID_TRANSITIONS = {
  'Applied': ['Under Review', 'Shortlisted', 'Rejected'],
  'Under Review': ['Shortlisted', 'Interview Scheduled', 'Rejected'],
  'Shortlisted': ['Interview Scheduled', 'Technical Round', 'Rejected'],
  'Interview Scheduled': ['Technical Round', 'HR Round', 'Selected', 'Offer Sent', 'Offer Received', 'Rejected'],
  'Technical Round': ['HR Round', 'Selected', 'Rejected'],
  'HR Round': ['Selected', 'Offer Sent', 'Rejected'],
  'Selected': ['Offer Sent', 'Offer Received', 'Rejected'],
  'Offer Sent': ['Joined', 'Offer Accepted', 'Rejected'],
  'Offer Received': ['Offer Accepted', 'Rejected'],
  'Offer Accepted': ['Joined', 'Placed', 'Rejected'],
  'Placed': ['Joined'],
  'Joined': [],
  'Rejected': ['Applied', 'Under Review', 'Shortlisted'], // Can re-open
};

/**
 * Create a new pipeline entry (recruiter initiates contact with a student).
 */
const createPipeline = async (recruiterId, data) => {
  const { studentId, role, recruiterMessage } = data;

  // Prevent duplicate active pipelines for same student+recruiter
  const existing = await RecruitmentPipeline.findOne({
    studentId,
    recruiterId,
    status: { $nin: ['Rejected', 'Placed', 'Joined'] },
  });
  if (existing) {
    throw new Error('An active pipeline already exists for this student.');
  }

  const recruiter = await User.findById(recruiterId).select('companyName name');

  const pipeline = await RecruitmentPipeline.create({
    studentId,
    recruiterId,
    companyId: recruiterId,
    companyName: recruiter?.companyName || 'Unknown Company',
    role,
    status: 'Applied',
    recruiterMessage: recruiterMessage || '',
    timeline: [
      {
        status: 'Applied',
        updatedAt: new Date(),
        updatedBy: recruiterId,
        note: 'Pipeline initiated by recruiter.',
      },
    ],
  });

  // Update student placement status to "Under Review" if they're still "Available"
  await User.findByIdAndUpdate(studentId, {
    $set: { placementStatus: 'Under Review' },
  });

  // Notify student
  await _createNotification({
    recipientId: studentId,
    senderId: recruiterId,
    type: 'pipeline_started',
    title: 'New Recruitment Interest',
    message: `${recruiter?.companyName || 'A company'} has initiated a hiring pipeline for the role of "${role}".`,
    metadata: { pipelineId: pipeline._id, companyName: pipeline.companyName, role },
  });

  return pipeline;
};

/**
 * Update pipeline status with validation and timeline tracking.
 */
const updatePipelineStatus = async (pipelineId, newStatus, updatedBy, note = '') => {
  const pipeline = await RecruitmentPipeline.findById(pipelineId);
  if (!pipeline) throw new Error('Pipeline not found.');

  const currentStatus = pipeline.status;
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Cannot transition from "${currentStatus}" to "${newStatus}".`);
  }

  pipeline.status = newStatus;
  pipeline.timeline.push({
    status: newStatus,
    updatedAt: new Date(),
    updatedBy,
    note,
  });

  // Handle student model status sync based on pipeline status
  let userPlacementStatusUpdate = 'Under Review';
  
  if (newStatus === 'Offer Accepted' || newStatus === 'Offer Sent' || newStatus === 'Offer Received' || newStatus === 'Selected') {
    userPlacementStatusUpdate = 'Offer Received';
  } else if (newStatus === 'Placed' || newStatus === 'Joined') {
    userPlacementStatusUpdate = 'Placed / Hired';
    await User.findByIdAndUpdate(pipeline.studentId, {
      $set: {
        placedCompany: pipeline.companyName,
        placedRole: pipeline.role,
        placementCTC: pipeline.offerDetails?.ctc || '',
        placementDate: new Date(),
      },
    });
  } else if (newStatus === 'Interview Scheduled') {
    userPlacementStatusUpdate = 'Interview Scheduled';
  } else if (newStatus === 'Rejected') {
    userPlacementStatusUpdate = 'Available for Hiring'; // Reset or keep available
  }

  await User.findByIdAndUpdate(pipeline.studentId, {
    $set: { placementStatus: userPlacementStatusUpdate },
  });

  if (newStatus === 'Offer Accepted' || newStatus === 'Joined' || newStatus === 'Placed') {
    pipeline.offerAccepted = true;
  }

  await pipeline.save();

  // Map status to notification type
  const notifTypeMap = {
    'Shortlisted': 'status_update',
    'Technical Round': 'status_update',
    'HR Round': 'status_update',
    'Selected': 'status_update',
    'Offer Sent': 'offer_received',
    'Interview Scheduled': 'interview_scheduled',
    'Offer Received': 'offer_received',
    'Offer Accepted': 'offer_accepted',
    'Placed': 'placement_confirmed',
    'Joined': 'placement_confirmed',
  };

  await _createNotification({
    recipientId: pipeline.studentId,
    senderId: updatedBy,
    type: notifTypeMap[newStatus] || 'status_update',
    title: `Pipeline Update: ${newStatus}`,
    message: `Your application for "${pipeline.role}" at ${pipeline.companyName} has been updated to "${newStatus}".${note ? ` Note: ${note}` : ''}`,
    metadata: { pipelineId: pipeline._id, companyName: pipeline.companyName, role: pipeline.role, status: newStatus },
  });

  // Notify Teachers of status updates if placed or selected
  if (['Selected', 'Offer Sent', 'Offer Accepted', 'Placed', 'Joined'].includes(newStatus)) {
    try {
      const student = await User.findById(pipeline.studentId).select('university name');
      if (student?.university?.name) {
        // Find teachers of the same college/department
        const teachers = await User.find({
          role: 'teacher',
          'university.name': student.university.name,
        }).select('_id');

        for (const t of teachers) {
          await _createNotification({
            recipientId: t._id,
            senderId: updatedBy,
            type: 'status_update',
            title: `Student Status Update: ${student.name} - ${newStatus}`,
            message: `Student "${student.name}" has reached "${newStatus}" for "${pipeline.role}" at ${pipeline.companyName}.`,
            metadata: { pipelineId: pipeline._id, studentId: student._id },
          });
        }
      }
    } catch (teacherNotifErr) {
      console.error('Error notifying teachers:', teacherNotifErr.message);
    }
  }
  return pipeline;
};

/**
 * Update interview details on a pipeline.
 */
const updateInterviewDetails = async (pipelineId, interviewDetails, updatedBy) => {
  const pipeline = await RecruitmentPipeline.findById(pipelineId);
  if (!pipeline) throw new Error('Pipeline not found.');

  pipeline.interviewDetails = { ...pipeline.interviewDetails, ...interviewDetails };
  pipeline.timeline.push({
    status: 'Interview Details Updated',
    updatedAt: new Date(),
    updatedBy,
    note: `Interview scheduled for ${interviewDetails.interviewDate || 'TBD'} (${interviewDetails.interviewMode || 'TBD'}).`,
  });
  await pipeline.save();

  // Notify student
  await _createNotification({
    recipientId: pipeline.studentId,
    senderId: updatedBy,
    type: 'interview_scheduled',
    title: 'Interview Scheduled',
    message: `Your interview for "${pipeline.role}" at ${pipeline.companyName} has been scheduled.`,
    metadata: { pipelineId: pipeline._id, interviewDetails },
  });

  return pipeline;
};

/**
 * Update offer details on a pipeline.
 */
const updateOfferDetails = async (pipelineId, offerDetails, updatedBy) => {
  const pipeline = await RecruitmentPipeline.findById(pipelineId);
  if (!pipeline) throw new Error('Pipeline not found.');

  pipeline.offerDetails = { ...pipeline.offerDetails, ...offerDetails };
  pipeline.timeline.push({
    status: 'Offer Details Updated',
    updatedAt: new Date(),
    updatedBy,
    note: `Offer details updated: CTC ${offerDetails.ctc || 'N/A'}.`,
  });
  await pipeline.save();

  await _createNotification({
    recipientId: pipeline.studentId,
    senderId: updatedBy,
    type: 'offer_received',
    title: 'Offer Details Updated',
    message: `Offer details for "${pipeline.role}" at ${pipeline.companyName} have been updated.`,
    metadata: { pipelineId: pipeline._id, offerDetails },
  });

  return pipeline;
};

/**
 * Get all pipelines for a recruiter.
 */
const getRecruiterPipelines = async (recruiterId, status) => {
  const query = { recruiterId };
  if (status) query.status = status;

  return RecruitmentPipeline.find(query)
    .populate('studentId', 'name username avatar scores university placementStatus isVerified')
    .sort({ updatedAt: -1 });
};

/**
 * Get all pipelines for a student.
 */
const getStudentPipelines = async (studentId) => {
  return RecruitmentPipeline.find({ studentId })
    .populate('recruiterId', 'name companyName')
    .sort({ updatedAt: -1 });
};

/**
 * Get a single pipeline with full details.
 */
const getPipelineById = async (pipelineId) => {
  return RecruitmentPipeline.findById(pipelineId)
    .populate('studentId', 'name username avatar scores university placementStatus isVerified')
    .populate('recruiterId', 'name companyName')
    .populate('timeline.updatedBy', 'name');
};

/**
 * Get pipeline stats for a recruiter.
 */
const getRecruiterPipelineStats = async (recruiterId) => {
  const mongoose = require('mongoose');
  const stats = await RecruitmentPipeline.aggregate([
    { $match: { recruiterId: new mongoose.Types.ObjectId(recruiterId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const result = {
    total: 0,
    Applied: 0,
    'Under Review': 0,
    'Interview Scheduled': 0,
    'Offer Received': 0,
    'Offer Accepted': 0,
    Placed: 0,
    Rejected: 0,
  };

  stats.forEach((s) => {
    result[s._id] = s.count;
    result.total += s.count;
  });

  return result;
};

/**
 * Update student availability settings.
 */
const updateAvailability = async (studentId, settings) => {
  const updates = {};

  if (settings.placementStatus) {
    updates.placementStatus = settings.placementStatus;
  }

  if (settings.availabilitySettings) {
    // Merge individual keys to preserve existing values
    Object.keys(settings.availabilitySettings).forEach((key) => {
      updates[`availabilitySettings.${key}`] = settings.availabilitySettings[key];
    });
  }

  const user = await User.findByIdAndUpdate(studentId, { $set: updates }, { new: true })
    .select('placementStatus availabilitySettings placedCompany placedRole placementCTC placementDate');

  return user;
};

/**
 * Get student availability info.
 */
const getAvailability = async (studentId) => {
  return User.findById(studentId)
    .select('placementStatus availabilitySettings placedCompany placedRole placementCTC placementDate name');
};

/**
 * Internal: Create a notification and emit via socket.io if available.
 */
const _createNotification = async (data) => {
  const notification = await RecruitmentNotification.create(data);

  // Attempt realtime push via socket.io
  try {
    const { getIO } = require('../config/socket');
    const io = getIO();
    io.to(data.recipientId.toString()).emit('notification', {
      ...notification.toObject(),
    });
  } catch (err) {
    // Socket may not be initialized in tests — silently ignore
  }

  return notification;
};

module.exports = {
  createPipeline,
  updatePipelineStatus,
  updateInterviewDetails,
  updateOfferDetails,
  getRecruiterPipelines,
  getStudentPipelines,
  getPipelineById,
  getRecruiterPipelineStats,
  updateAvailability,
  getAvailability,
};
