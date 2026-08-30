/**
 * MAVI Career Lab Routes
 */

const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getProfile,
  runSimulation,
  getRoleComparison,
  createSavedScenario,
  listSavedScenarios,
  removeSavedScenario,
  addToRoadmap,
} = require('../controllers/careerLabController');

const router = express.Router();

// All Career Lab routes require authenticated student session
router.use(protect);

router.get('/', getProfile);
router.post('/simulate', runSimulation);
router.get('/compare-roles', getRoleComparison);
router.post('/scenarios', createSavedScenario);
router.get('/scenarios', listSavedScenarios);
router.delete('/scenarios/:id', removeSavedScenario);
router.post('/add-to-roadmap', addToRoadmap);

module.exports = router;
