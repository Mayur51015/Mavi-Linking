const recruiterService = require('../services/recruiterService');

/**
 * @desc    Get recruiter dashboard stats
 * @route   GET /api/recruiter/stats
 * @access  Private (recruiter)
 */
const getRecruiterStats = async (req, res, next) => {
  try {
    const stats = await recruiterService.getRecruiterStats(req.user);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search developers (scoped to allowed colleges/departments)
 * @route   GET /api/recruiter/search
 * @access  Private (recruiter)
 */
const searchDevelopers = async (req, res, next) => {
  try {
    const { skills, minScore, maxScore, tier, university, department, graduationYear, experienceLevel, isVerified, page, limit, sortBy, order } = req.query;
    const skillsArr = skills ? skills.split(',').map(s => s.trim()) : undefined;

    const result = await recruiterService.searchDevelopers({
      skills: skillsArr, minScore, maxScore, tier,
      university, department, graduationYear, experienceLevel, isVerified, page, limit, sortBy, order,
    }, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Compare developers side-by-side
 * @route   POST /api/recruiter/compare
 * @access  Private (recruiter)
 */
const compareDevelopers = async (req, res, next) => {
  try {
    const { developerIds } = req.body;
    const result = await recruiterService.compareDevelopers(developerIds);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bookmark a developer
 * @route   POST /api/recruiter/bookmarks
 * @access  Private (recruiter)
 */
const addBookmark = async (req, res, next) => {
  try {
    const { developerId, notes, tags } = req.body;
    const bookmark = await recruiterService.bookmarkDeveloper(req.user.id, developerId, notes, tags);
    res.status(201).json({ success: true, data: bookmark });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove a bookmark
 * @route   DELETE /api/recruiter/bookmarks/:developerId
 * @access  Private (recruiter)
 */
const removeBookmark = async (req, res, next) => {
  try {
    await recruiterService.removeBookmark(req.user.id, req.params.developerId);
    res.status(200).json({ success: true, message: 'Bookmark removed' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all bookmarks
 * @route   GET /api/recruiter/bookmarks
 * @access  Private (recruiter)
 */
const getBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await recruiterService.getBookmarks(req.user.id, req.query.status);
    res.status(200).json({ success: true, data: bookmarks });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a bookmark (notes, status, tags)
 * @route   PUT /api/recruiter/bookmarks/:developerId
 * @access  Private (recruiter)
 */
const updateBookmark = async (req, res, next) => {
  try {
    const bookmark = await recruiterService.updateBookmark(req.user.id, req.params.developerId, req.body);
    res.status(200).json({ success: true, data: bookmark });
  } catch (error) {
    next(error);
  }
};

const CompanyProfile = require('../models/CompanyProfile');

/**
 * @desc    Get company profile
 * @route   GET /api/recruiter/company
 * @access  Private (recruiter)
 */
const getCompanyProfile = async (req, res, next) => {
  try {
    let company = await CompanyProfile.findOne({ recruiterId: req.user.id });
    if (!company) {
      company = await CompanyProfile.create({
        recruiterId: req.user.id,
        companyName: req.user.companyName || 'Unknown Company',
      });
    }
    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update company profile
 * @route   PUT /api/recruiter/company
 * @access  Private (recruiter)
 */
const updateCompanyProfile = async (req, res, next) => {
  try {
    const company = await CompanyProfile.findOneAndUpdate(
      { recruiterId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecruiterStats,
  searchDevelopers,
  compareDevelopers,
  addBookmark,
  removeBookmark,
  getBookmarks,
  updateBookmark,
  getCompanyProfile,
  updateCompanyProfile
};
