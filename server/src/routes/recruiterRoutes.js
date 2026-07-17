const express = require('express');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  searchDevelopers,
  compareDevelopers,
  addBookmark,
  removeBookmark,
  getBookmarks,
  updateBookmark,
  getRecruiterStats,
  getCompanyProfile,
  updateCompanyProfile
} = require('../controllers/recruiterController');

const router = express.Router();

// All recruiter routes require authentication + recruiter role
router.use(protect, requireRole('recruiter', 'admin'));

// Stats
router.get('/stats', getRecruiterStats);

// Company Profile
router.route('/company')
  .get(getCompanyProfile)
  .put(updateCompanyProfile);

// Search & Compare
router.get('/search', searchDevelopers);
router.post('/compare', compareDevelopers);

// Bookmarks
router.route('/bookmarks')
  .get(getBookmarks)
  .post(addBookmark);

router.route('/bookmarks/:developerId')
  .put(updateBookmark)
  .delete(removeBookmark);

module.exports = router;
