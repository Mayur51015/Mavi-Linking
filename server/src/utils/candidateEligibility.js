/**
 * Configurable Candidate Eligibility Policy for Department Admin Appointment
 * 
 * Rules:
 * 1. Candidate must exist and have account status 'active' / 'ACTIVE'.
 * 2. Candidate must belong to the authorized target institution.
 * 3. Candidate role must be eligible (default: 'teacher', 'professor', or staff).
 * 4. Ineligible roles by default: 'user', 'student', 'recruiter', 'super_admin', 'platform_owner', 'owner'.
 */

const ELIGIBILITY_CONFIG = {
  // Allowed primary roles that can be appointed as Department Admin
  allowedRoles: ['teacher', 'professor', 'admin', 'user'],
  // Disallowed roles that MUST NOT be appointed as Department Admin
  disallowedRoles: ['recruiter', 'super_admin', 'platform_owner', 'owner'],
  // Require candidate to belong to the exact institution ID
  enforceInstitutionMatch: true,
};

/**
 * Validates whether a candidate user is eligible for Department Admin appointment.
 * 
 * @param {Object} candidate - User document
 * @param {String|Object} targetInstitutionId - Authorized target institution ObjectId
 * @returns {Object} { eligible: boolean, reason: string }
 */
const checkCandidateEligibility = (candidate, targetInstitutionId) => {
  if (!candidate) {
    return { eligible: false, reason: 'Candidate user record not found.' };
  }

  // Account status check
  const status = (candidate.status || '').toLowerCase();
  if (status === 'suspended') {
    return { eligible: false, reason: 'Suspended user accounts cannot be appointed as Department Admin.' };
  }

  // Disallowed roles check
  const primaryRole = (candidate.role || '').toLowerCase();
  if (ELIGIBILITY_CONFIG.disallowedRoles.includes(primaryRole)) {
    return { eligible: false, reason: `Users with role '${candidate.role}' are not eligible for Department Admin appointment.` };
  }

  // Institution matching check
  if (ELIGIBILITY_CONFIG.enforceInstitutionMatch && targetInstitutionId) {
    const candidateInstId = candidate.institutionId ? (candidate.institutionId._id || candidate.institutionId).toString() : null;
    const targetInstId = targetInstitutionId.toString();

    if (candidateInstId && candidateInstId !== targetInstId) {
      return { eligible: false, reason: 'Candidate does not belong to the target institution.' };
    }
  }

  return { eligible: true, reason: 'Candidate is eligible for Department Admin appointment.' };
};

module.exports = {
  ELIGIBILITY_CONFIG,
  checkCandidateEligibility,
};
