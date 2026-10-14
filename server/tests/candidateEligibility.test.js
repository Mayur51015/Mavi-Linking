const {
  ELIGIBILITY_CONFIG,
  checkCandidateEligibility,
} = require('../src/utils/candidateEligibility');

describe('Candidate Eligibility Policy Unit Tests', () => {
  const targetInstitutionId = '507f1f77bcf86cd799439011';

  it('rejects null or undefined candidate', () => {
    const resNull = checkCandidateEligibility(null, targetInstitutionId);
    expect(resNull.eligible).toBe(false);
    expect(resNull.reason).toMatch(/record not found/i);

    const resUndefined = checkCandidateEligibility(undefined, targetInstitutionId);
    expect(resUndefined.eligible).toBe(false);
    expect(resUndefined.reason).toMatch(/record not found/i);
  });

  it('rejects suspended accounts regardless of role or institution', () => {
    const candidate = {
      role: 'teacher',
      status: 'suspended',
      institutionId: targetInstitutionId,
    };
    const res = checkCandidateEligibility(candidate, targetInstitutionId);
    expect(res.eligible).toBe(false);
    expect(res.reason).toMatch(/suspended user accounts cannot be appointed/i);
  });

  it('rejects disallowed roles (e.g. recruiter, super_admin, platform_owner, owner)', () => {
    ELIGIBILITY_CONFIG.disallowedRoles.forEach((role) => {
      const candidate = {
        role,
        status: 'active',
        institutionId: targetInstitutionId,
      };
      const res = checkCandidateEligibility(candidate, targetInstitutionId);
      expect(res.eligible).toBe(false);
      expect(res.reason).toMatch(new RegExp(`role '${role}' are not eligible`, 'i'));
    });
  });

  it('rejects candidates whose institutionId does not match targetInstitutionId', () => {
    const candidate = {
      role: 'teacher',
      status: 'active',
      institutionId: '507f1f77bcf86cd799439099', // different institution
    };
    const res = checkCandidateEligibility(candidate, targetInstitutionId);
    expect(res.eligible).toBe(false);
    expect(res.reason).toMatch(/does not belong to the target institution/i);
  });

  it('accepts valid teacher candidate matching the target institution', () => {
    const candidate = {
      role: 'teacher',
      status: 'active',
      institutionId: targetInstitutionId,
    };
    const res = checkCandidateEligibility(candidate, targetInstitutionId);
    expect(res.eligible).toBe(true);
    expect(res.reason).toMatch(/is eligible/i);
  });

  it('accepts populated institutionId object matching target institution', () => {
    const candidate = {
      role: 'professor',
      status: 'active',
      institutionId: { _id: targetInstitutionId, name: 'University Institute' },
    };
    const res = checkCandidateEligibility(candidate, targetInstitutionId);
    expect(res.eligible).toBe(true);
  });
});
