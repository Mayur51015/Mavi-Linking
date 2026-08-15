const Institution = require('../models/Institution');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Department = require('../models/Department');

const DEFAULT_PLAN_LIMITS = {
  BASIC: {
    maxStudents: 250,
    maxTeachers: 25,
    maxRecruiters: 5,
    maxDepartments: 3,
    features: {
      developerDNA: true,
      recruiterAIReport: true,
      advancedAnalytics: false,
      aiCareerGuidance: true,
      placementEngine: false,
    },
  },
  PRO: {
    maxStudents: 1000,
    maxTeachers: 100,
    maxRecruiters: 25,
    maxDepartments: 10,
    features: {
      developerDNA: true,
      recruiterAIReport: true,
      advancedAnalytics: true,
      aiCareerGuidance: true,
      placementEngine: true,
    },
  },
  ENTERPRISE: {
    maxStudents: 10000,
    maxTeachers: 500,
    maxRecruiters: 100,
    maxDepartments: 50,
    features: {
      developerDNA: true,
      recruiterAIReport: true,
      advancedAnalytics: true,
      aiCareerGuidance: true,
      placementEngine: true,
    },
  },
};

/**
 * Get active plan & entitlements for an institution
 */
const getInstitutionEntitlements = async (institutionId) => {
  if (!institutionId) return null;

  const institution = await Institution.findById(institutionId);
  if (!institution) return null;

  const planCode = (institution.plan || 'ENTERPRISE').toUpperCase();
  const subscription = await Subscription.findOne({ institutionId, status: { $in: ['ACTIVE', 'TRIALING', 'active'] } });

  const planConfig = DEFAULT_PLAN_LIMITS[planCode] || DEFAULT_PLAN_LIMITS.ENTERPRISE;

  return {
    institutionId: institution._id,
    tenantId: institution.tenantId,
    institutionName: institution.name,
    planCode,
    subscriptionStatus: subscription?.status || institution.subscriptionStatus || 'ACTIVE',
    licenseStatus: institution.licenseStatus || 'active',
    limits: planConfig.maxStudents !== undefined ? planConfig : DEFAULT_PLAN_LIMITS.ENTERPRISE,
    features: { ...planConfig.features, ...(institution.features || {}) },
  };
};

/**
 * Verify resource creation limits (Students, Teachers, Recruiters, Departments)
 */
const checkPlanLimit = async (institutionId, resourceType) => {
  if (!institutionId) {
    return { allowed: true, currentCount: 0, limit: 0 };
  }

  const entitlements = await getInstitutionEntitlements(institutionId);
  if (!entitlements) {
    return { allowed: true, currentCount: 0, limit: 0 };
  }

  const planCode = entitlements.planCode;
  const config = DEFAULT_PLAN_LIMITS[planCode] || DEFAULT_PLAN_LIMITS.ENTERPRISE;

  let currentCount = 0;
  let limit = 0;

  switch (resourceType.toLowerCase()) {
    case 'student':
    case 'students':
      limit = config.maxStudents;
      currentCount = await User.countDocuments({ institutionId, role: { $in: ['user', 'student', 'developer'] } });
      break;
    case 'teacher':
    case 'teachers':
      limit = config.maxTeachers;
      currentCount = await User.countDocuments({ institutionId, role: { $in: ['teacher', 'professor'] } });
      break;
    case 'recruiter':
    case 'recruiters':
      limit = config.maxRecruiters;
      currentCount = await User.countDocuments({ institutionId, role: 'recruiter' });
      break;
    case 'department':
    case 'departments':
      limit = config.maxDepartments;
      currentCount = await Department.countDocuments({ institutionId });
      break;
    default:
      return { allowed: true, currentCount: 0, limit: 0 };
  }

  // limit === 0 implies unlimited capacity
  const allowed = limit === 0 || currentCount < limit;

  return {
    allowed,
    currentCount,
    limit,
    resourceType,
    planCode,
    message: allowed
      ? `Within plan limit (${currentCount}/${limit})`
      : `Plan resource limit reached for ${resourceType} (${currentCount}/${limit}). Upgrade subscription plan at /admin/billing to increase capacity.`,
  };
};

/**
 * Verify feature entitlement access
 */
const hasFeatureAccess = async (institutionId, featureName) => {
  if (!institutionId) return true;

  const entitlements = await getInstitutionEntitlements(institutionId);
  if (!entitlements) return true;

  if (entitlements.subscriptionStatus === 'SUSPENDED' || entitlements.subscriptionStatus === 'EXPIRED') {
    return false;
  }

  return !!entitlements.features[featureName];
};

module.exports = {
  DEFAULT_PLAN_LIMITS,
  getInstitutionEntitlements,
  checkPlanLimit,
  hasFeatureAccess,
};
