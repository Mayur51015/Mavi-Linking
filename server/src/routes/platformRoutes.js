const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getLinkedPlatforms,  getAllPlatformData,
  getPlatformData,  getGitHubIntelligence,
  syncGitHubIntelligence,  linkPlatform,
  unlinkPlatform,
  linkMultiplePlatforms,
} = require('../controllers/platformController');

const router = express.Router();

const linkPlatformValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isString()
    .withMessage('Username must be a string'),
];

const bulkPlatformValidation = [
  body('platforms')
    .exists()
    .withMessage('platforms object is required')
    .custom((value) => {
      if (typeof value !== 'object' || Array.isArray(value) || value === null) {
        throw new Error('platforms must be an object');
      }
      return true;
    }),
];

// ─── All platform routes are protected ──────────────────────────────────────
router.use(protect);

// GET  /api/platforms/github/intelligence → Get structured GitHub Intelligence & score breakdown
router.get('/github/intelligence', getGitHubIntelligence);

// POST /api/platforms/github/sync         → Explicit GitHub Intelligence synchronization
router.post('/github/sync', syncGitHubIntelligence);

// GET  /api/platforms          → Get all linked platform statuses
// PUT  /api/platforms          → Bulk link multiple platforms at once
router.route('/')
  .get(getLinkedPlatforms)
  .put(bulkPlatformValidation, validate, linkMultiplePlatforms);

// GET  /api/platforms/data     → Get cached or freshly fetched platform profiles for all linked platforms
router.get('/data', getAllPlatformData);

// GET  /api/platforms/:platform/data → Get cached or refreshed profile for one platform
router.get('/:platform/data', getPlatformData);

// PUT    /api/platforms/:platform  → Link or update a single platform
// DELETE /api/platforms/:platform  → Unlink a single platform
router.route('/:platform')
  .put(linkPlatformValidation, validate, linkPlatform)
  .delete(unlinkPlatform);

module.exports = router;
