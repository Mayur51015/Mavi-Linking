import api from './axios';

/**
 * Fetch Career Match analysis for authenticated student.
 * Optional role param to view analysis for a specific target role without saving.
 */
export const getCareerMatch = async (role = null) => {
  const url = role ? `/career-match?role=${encodeURIComponent(role)}` : '/career-match';
  const response = await api.get(url);
  return response.data;
};

/**
 * Fetch all canonical supported target career roles.
 */
export const getSupportedRoles = async () => {
  const response = await api.get('/career-match/roles');
  return response.data;
};

/**
 * Update the student's target career role and recalculate match.
 */
export const updateTargetRole = async (role) => {
  const response = await api.put('/career-match/target-role', { role });
  return response.data;
};
