const Job = require('../models/Job');
const CompanyProfile = require('../models/CompanyProfile');

exports.createJob = async (req, res, next) => {
  try {
    const recruiterId = req.user.id;
    let company = await CompanyProfile.findOne({ recruiterId });
    if (!company) {
      company = await CompanyProfile.create({
        recruiterId,
        companyName: req.user.companyName || 'Unknown Company',
      });
    }

    const job = await Job.create({
      ...req.body,
      recruiterId,
      companyId: company._id,
    });

    res.status(201).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

exports.getJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find().populate('companyId');
    res.status(200).json({ success: true, data: jobs });
  } catch (err) {
    next(err);
  }
};

exports.getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('companyId');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.status(200).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

exports.updateJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, recruiterId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Job not found or unauthorized' });
    res.status(200).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, recruiterId: req.user.id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found or unauthorized' });
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
