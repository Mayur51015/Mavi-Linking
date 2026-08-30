/**
 * MAVI Career Match Routes
 */

const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getCareerMatch,
  getCareerMatchByRole,
  getSupportedRoles,
  updateTargetRole,
} = require('../controllers/careerMatchController');

const router = express.Router();

// Public/Protected metadata: get list of all supported target roles
router.get('/roles', getSupportedRoles);

// All user-specific match calculation routes require authentication
router.use(protect);

router.get('/', getCareerMatch);
router.get('/role/:role', getCareerMatchByRole);
router.put('/target-role', updateTargetRole);

module.exports = router;
