const Company = require('../models/Company');
const ActivityLog = require('../models/ActivityLog');

/**
 * @desc    Get recruiter's company profile
 * @route   GET /api/recruiter/company
 * @access  Private (recruiter)
 */
const getCompany = async (req, res, next) => {
  try {
    let company = await Company.findOne({ recruiterId: req.user.id });
    if (!company) {
      // Create empty profile by default so recruiter has one to edit
      company = await Company.create({
        recruiterId: req.user.id,
        name: req.user.companyName || 'My Company',
      });
    }

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create or update recruiter's company profile
 * @route   PUT /api/recruiter/company
 * @access  Private (recruiter)
 */
const updateCompany = async (req, res, next) => {
  try {
    const { name, logo, description, website, industry, location, hrContact } = req.body;
    const updateFields = { name, logo, description, website, industry, location, hrContact };

    let company = await Company.findOneAndUpdate(
      { recruiterId: req.user.id },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: true }
    );

    await ActivityLog.create({
      userId: req.user.id,
      action: 'Update Company Profile',
      details: `Updated company info for ${company.name}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompany,
  updateCompany,
};
