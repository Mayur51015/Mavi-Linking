/**
 * MAVI Career Lab Controller
 */

const {
  getCareerLabProfile,
  simulateScenario,
  compareAllRoles,
  saveScenario,
  getSavedScenarios,
  deleteSavedScenario,
  addScenarioToRoadmap,
} = require('../services/careerLabService');

/**
 * @desc    Get Career Lab profile snapshot and available simulation options
 * @route   GET /api/career-lab
 * @access  Private (Authenticated student)
 */
const getProfile = async (req, res, next) => {
  try {
    const roleQuery = req.query.role || null;
    const result = await getCareerLabProfile(req.user.id, roleQuery);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Run What-If Career Simulation
 * @route   POST /api/career-lab/simulate
 * @access  Private (Authenticated student)
 */
const runSimulation = async (req, res, next) => {
  try {
    const { targetRole, hypotheticalChanges } = req.body || {};
    const result = await simulateScenario(req.user.id, targetRole, hypotheticalChanges || {});
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Compare Career Match across all canonical roles
 * @route   GET /api/career-lab/compare-roles
 * @access  Private (Authenticated student)
 */
const getRoleComparison = async (req, res, next) => {
  try {
    const result = await compareAllRoles(req.user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Save a What-If Scenario
 * @route   POST /api/career-lab/scenarios
 * @access  Private (Authenticated student)
 */
const createSavedScenario = async (req, res, next) => {
  try {
    const { name, targetRole, hypotheticalChanges } = req.body || {};
    const result = await saveScenario(req.user.id, name, targetRole, hypotheticalChanges || {});
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List saved scenarios for student
 * @route   GET /api/career-lab/scenarios
 * @access  Private (Authenticated student)
 */
const listSavedScenarios = async (req, res, next) => {
  try {
    const result = await getSavedScenarios(req.user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a saved scenario
 * @route   DELETE /api/career-lab/scenarios/:id
 * @access  Private (Authenticated student)
 */
const removeSavedScenario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deleteSavedScenario(req.user.id, id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add simulated milestones to student Career Roadmap
 * @route   POST /api/career-lab/add-to-roadmap
 * @access  Private (Authenticated student)
 */
const addToRoadmap = async (req, res, next) => {
  try {
    const { targetRole, hypotheticalChanges } = req.body || {};
    const result = await addScenarioToRoadmap(req.user.id, targetRole, hypotheticalChanges || {});
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  runSimulation,
  getRoleComparison,
  createSavedScenario,
  listSavedScenarios,
  removeSavedScenario,
  addToRoadmap,
};
