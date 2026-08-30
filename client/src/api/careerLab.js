import api from './axios';

/**
 * Fetch student Career Lab profile snapshot and available simulation options.
 */
export const getCareerLabProfile = async (role = null) => {
  const url = role ? `/career-lab?role=${encodeURIComponent(role)}` : '/career-lab';
  const response = await api.get(url);
  return response.data;
};

/**
 * Execute What-If career simulation for specified hypothetical changes.
 */
export const simulateScenario = async (targetRole, hypotheticalChanges) => {
  const response = await api.post('/career-lab/simulate', {
    targetRole,
    hypotheticalChanges,
  });
  return response.data;
};

/**
 * Compare career match percentages across all canonical roles.
 */
export const compareAllRoles = async () => {
  const response = await api.get('/career-lab/compare-roles');
  return response.data;
};

/**
 * Save a What-If scenario to the student's Career Lab library.
 */
export const saveScenario = async (name, targetRole, hypotheticalChanges) => {
  const response = await api.post('/career-lab/scenarios', {
    name,
    targetRole,
    hypotheticalChanges,
  });
  return response.data;
};

/**
 * List all saved What-If scenarios for the student.
 */
export const getSavedScenarios = async () => {
  const response = await api.get('/career-lab/scenarios');
  return response.data;
};

/**
 * Delete a saved scenario.
 */
export const deleteSavedScenario = async (id) => {
  const response = await api.delete(`/career-lab/scenarios/${id}`);
  return response.data;
};

/**
 * Add simulated milestone actions to the student's active Career Roadmap.
 */
export const addScenarioToRoadmap = async (targetRole, hypotheticalChanges) => {
  const response = await api.post('/career-lab/add-to-roadmap', {
    targetRole,
    hypotheticalChanges,
  });
  return response.data;
};
