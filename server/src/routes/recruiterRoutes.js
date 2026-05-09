const express = require('express');
const { protect } = require('../middleware/auth');
const {
  searchDevelopers,
  compareDevelopers,
  addBookmark,
  removeBookmark,
  getBookmarks,
  updateBookmark,
} = require('../controllers/recruiterController');

const router = express.Router();

router.use(protect);

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
