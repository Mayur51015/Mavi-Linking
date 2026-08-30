/**
 * MAVI Career Lab — Simulation & What-If Service
 *
 * Provides safe, deterministic simulation of hypothetical career improvements
 * without modifying real student profiles, projects, skills, or platform metrics.
 */

const User = require('../models/User');
const Project = require('../models/Project');
const CareerRoadmap = require('../models/CareerRoadmap');
const CareerScenario = require('../models/CareerScenario');
const {
  buildStudentEvidence,
  calculateCareerMatch,
} = require('./careerMatchService');
const {
  getRoleRequirement,
  getAllSupportedRoles,
} = require('../constants/careerRoleRequirements');

const SCORING_VERSION = '1.0';

/**
 * Deep-clone helper for evidence objects to guarantee profile immutability
 */
function cloneEvidence(evidence) {
  return JSON.parse(JSON.stringify(evidence));
}

/**
 * Apply hypothetical changes to a cloned evidence object
 */
function applyHypotheticalChanges(baseEvidence, targetRole, changes = {}) {
  const simulated = cloneEvidence(baseEvidence);
  const roleReq = getRoleRequirement(targetRole);

  // 1. Hypothetical Skills
  if (Array.isArray(changes.skills) && changes.skills.length > 0) {
    changes.skills.forEach((skillName) => {
      if (!skillName || typeof skillName !== 'string') return;
      const cleanName = skillName.trim();
      const existing = simulated.skillsList.find(
        (s) => s.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (!existing) {
        simulated.skillsList.push({
          name: cleanName,
          level: 'Intermediate',
          verified: false,
          isSimulated: true,
        });
      }
    });
  }

  // 2. Hypothetical Projects
  if (Array.isArray(changes.projects) && changes.projects.length > 0) {
    changes.projects.forEach((proj, idx) => {
      const projTechs = Array.isArray(proj.technologies) && proj.technologies.length > 0
        ? proj.technologies
        : roleReq.requiredSkills.slice(0, 3);

      const simProj = {
        id: `sim_proj_${Date.now()}_${idx}`,
        title: proj.title || `Simulated ${proj.category || 'Portfolio'} Project`,
        description: proj.description || `Comprehensive implementation utilizing ${projTechs.join(', ')}`,
        technologies: projTechs,
        githubRepo: 'https://github.com/simulation/repo',
        liveUrl: 'https://simulation.app',
        isSimulated: true,
      };

      simulated.projects.push(simProj);

      // Register technologies in projectSkillsMap
      projTechs.forEach((t) => {
        const lower = t.toLowerCase();
        if (!simulated.projectSkillsMap[lower]) {
          simulated.projectSkillsMap[lower] = { name: t, projects: [] };
        }
        simulated.projectSkillsMap[lower].projects.push(simProj.title);
      });
    });
  }

  // 3. Hypothetical Coding Benchmark Improvements
  if (changes.coding && typeof changes.coding === 'object') {
    const additional = Number(changes.coding.additionalSolved) || 0;
    if (additional > 0) {
      simulated.coding.isConnected = true;
      simulated.coding.leetcodeSolved = (simulated.coding.leetcodeSolved || 0) + additional;
      simulated.coding.leetcodeMedium = (simulated.coding.leetcodeMedium || 0) + Math.round(additional * 0.6);
      simulated.user.scores.problemSolving = Math.min((simulated.user.scores.problemSolving || 300) + additional * 4, 950);
    }
  }

  // 4. Hypothetical Development / GitHub Improvements
  if (changes.development && typeof changes.development === 'object') {
    const repos = Number(changes.development.additionalRepos) || 0;
    if (repos > 0) {
      simulated.github.isConnected = true;
      simulated.github.repoCount = (simulated.github.repoCount || 0) + repos;
      simulated.user.scores.development = Math.min((simulated.user.scores.development || 350) + repos * 25, 950);
    }
    if (changes.development.openSourceContribution || changes.development.testingAdded) {
      simulated.github.isConnected = true;
      simulated.user.scores.development = Math.min((simulated.user.scores.development || 400) + 50, 950);
    }
  }

  // 5. Hypothetical Profile Completeness
  if (changes.profile && typeof changes.profile === 'object') {
    if (changes.profile.completedMissing) {
      simulated.user.profileCompletion = 100;
    }
    if (Array.isArray(changes.profile.certifications) && changes.profile.certifications.length > 0) {
      simulated.user.scores.knowledge = Math.min((simulated.user.scores.knowledge || 400) + changes.profile.certifications.length * 30, 950);
    }
  }

  return simulated;
}

/**
 * Retrieve current Career Lab profile state and role recommendations
 */
async function getCareerLabProfile(userId, requestedRole = null) {
  const evidence = await buildStudentEvidence(userId);
  const targetRole = requestedRole || evidence.user.preferredRole || 'Full-Stack Developer';
  const roleReq = getRoleRequirement(targetRole);

  const currentMatch = calculateCareerMatch(evidence, targetRole);

  // Available hypothetical actions tailored specifically for this role and current gaps
  const currentSkillNames = new Set(evidence.skillsList.map((s) => s.name.toLowerCase()));
  const recommendedSkillsToSimulate = [...roleReq.requiredSkills, ...roleReq.preferredSkills]
    .filter((s) => !currentSkillNames.has(s.toLowerCase()))
    .slice(0, 8);

  const predefinedProjectOptions = [
    {
      id: 'prod_fullstack_app',
      title: 'Build Production-Grade Full-Stack Application',
      category: 'production_project',
      technologies: roleReq.requiredSkills.slice(0, 4),
      description: 'End-to-end cloud-deployed app with authentication, database indexing, and CI/CD pipelines.',
    },
    {
      id: 'cloud_microservices',
      title: 'Microservices & Cloud Deployment',
      category: 'cloud_deployment',
      technologies: ['Docker', 'AWS', 'REST APIs', 'PostgreSQL'],
      description: 'Containerized architecture with automated container builds and monitoring.',
    },
    {
      id: 'testing_suite',
      title: 'Automated Testing & QA Integration',
      category: 'testing_project',
      technologies: ['Jest', 'Supertest', 'Automated Testing', 'CI/CD'],
      description: 'Comprehensive unit, integration, and E2E test suites with high code coverage.',
    },
  ];

  return {
    success: true,
    data: {
      user: {
        id: evidence.user.id,
        name: evidence.user.name,
        maviId: evidence.user.maviId,
        preferredRole: evidence.user.preferredRole,
        preferredDomain: evidence.user.preferredDomain,
        maviScore: evidence.user.scores.overall,
        profileStrength: evidence.user.profileCompletion,
        dnaArchetype: evidence.dna.personalityType,
      },
      targetRole,
      domain: roleReq.domain,
      currentMatch,
      availableSimulations: {
        skills: recommendedSkillsToSimulate,
        projects: predefinedProjectOptions,
        codingOptions: [
          { label: 'Solve 15 Algorithmic Problems', additionalSolved: 15 },
          { label: 'Solve 30 Medium Problems', additionalSolved: 30 },
          { label: 'Solve 50 Advanced Problems', additionalSolved: 50 },
        ],
        developmentOptions: [
          { label: 'Publish 2 Production Repositories', additionalRepos: 2 },
          { label: 'Contribute to Open-Source Projects', openSourceContribution: true },
          { label: 'Integrate Automated Testing & CI/CD', testingAdded: true },
        ],
      },
      scoringVersion: SCORING_VERSION,
    },
  };
}

/**
 * Execute What-If simulation for given hypothetical changes against target role.
 * GUARANTEES: Real user records in MongoDB are NEVER modified.
 */
async function simulateScenario(userId, targetRole, hypotheticalChanges = {}) {
  const baseEvidence = await buildStudentEvidence(userId);
  const activeRole = targetRole || baseEvidence.user.preferredRole || 'Full-Stack Developer';
  const roleReq = getRoleRequirement(activeRole);

  // 1. Calculate Baseline Current Match
  const currentMatch = calculateCareerMatch(baseEvidence, activeRole);

  // 2. Build and Evaluate Combined Hypothetical Evidence
  const combinedEvidence = applyHypotheticalChanges(baseEvidence, activeRole, hypotheticalChanges);
  const simulatedMatch = calculateCareerMatch(combinedEvidence, activeRole);

  // 3. Compute Delta / Estimated Impact
  const estimatedImpact = simulatedMatch.overallMatch - currentMatch.overallMatch;

  // 4. Calculate Category-by-Category Impact
  const categoryImpact = {
    technicalSkills: {
      current: currentMatch.breakdown.technicalSkills.score,
      simulated: simulatedMatch.breakdown.technicalSkills.score,
      delta: simulatedMatch.breakdown.technicalSkills.score - currentMatch.breakdown.technicalSkills.score,
    },
    problemSolving: {
      current: currentMatch.breakdown.problemSolving.score,
      simulated: simulatedMatch.breakdown.problemSolving.score,
      delta: simulatedMatch.breakdown.problemSolving.score - currentMatch.breakdown.problemSolving.score,
    },
    projects: {
      current: currentMatch.breakdown.projects.score,
      simulated: simulatedMatch.breakdown.projects.score,
      delta: simulatedMatch.breakdown.projects.score - currentMatch.breakdown.projects.score,
    },
    developmentActivity: {
      current: currentMatch.breakdown.developmentActivity.score,
      simulated: simulatedMatch.breakdown.developmentActivity.score,
      delta: simulatedMatch.breakdown.developmentActivity.score - currentMatch.breakdown.developmentActivity.score,
    },
    profile: {
      current: currentMatch.breakdown.profile.score,
      simulated: simulatedMatch.breakdown.profile.score,
      delta: simulatedMatch.breakdown.profile.score - currentMatch.breakdown.profile.score,
    },
  };

  // 5. Determine Highest-Impact Individual Action (via isolated single-variable simulations)
  let highestImpactAction = { title: 'No single action chosen', impact: 0 };
  let bestDelta = -1;

  // Check individual skills
  if (Array.isArray(hypotheticalChanges.skills)) {
    for (const skill of hypotheticalChanges.skills) {
      const singleSkillEvidence = applyHypotheticalChanges(baseEvidence, activeRole, { skills: [skill] });
      const res = calculateCareerMatch(singleSkillEvidence, activeRole);
      const delta = res.overallMatch - currentMatch.overallMatch;
      if (delta > bestDelta) {
        bestDelta = delta;
        highestImpactAction = { title: `Mastering ${skill}`, impact: delta };
      }
    }
  }

  // Check individual projects
  if (Array.isArray(hypotheticalChanges.projects)) {
    for (const proj of hypotheticalChanges.projects) {
      const singleProjEvidence = applyHypotheticalChanges(baseEvidence, activeRole, { projects: [proj] });
      const res = calculateCareerMatch(singleProjEvidence, activeRole);
      const delta = res.overallMatch - currentMatch.overallMatch;
      if (delta > bestDelta) {
        bestDelta = delta;
        highestImpactAction = { title: proj.title || 'Production Project', impact: delta };
      }
    }
  }

  // Check coding
  if (hypotheticalChanges.coding && hypotheticalChanges.coding.additionalSolved > 0) {
    const singleCodingEvidence = applyHypotheticalChanges(baseEvidence, activeRole, { coding: hypotheticalChanges.coding });
    const res = calculateCareerMatch(singleCodingEvidence, activeRole);
    const delta = res.overallMatch - currentMatch.overallMatch;
    if (delta > bestDelta) {
      bestDelta = delta;
      highestImpactAction = { title: `Solving ${hypotheticalChanges.coding.additionalSolved} Coding Problems`, impact: delta };
    }
  }

  // Generate clear, structured AI explanation of the simulation result
  const explanation = generateSimulationExplanation({
    targetRole: activeRole,
    currentScore: currentMatch.overallMatch,
    simulatedScore: simulatedMatch.overallMatch,
    delta: estimatedImpact,
    highestAction: highestImpactAction,
    categoryImpact,
    hypotheticalChanges,
  });

  return {
    success: true,
    data: {
      targetRole: activeRole,
      domain: roleReq.domain,
      currentMatch: currentMatch.overallMatch,
      simulatedMatch: simulatedMatch.overallMatch,
      estimatedImpact: Math.max(estimatedImpact, 0),
      confidence: simulatedMatch.confidence,
      categoryImpact,
      highestImpactAction,
      simulatedStrengths: simulatedMatch.strengths,
      simulatedGaps: simulatedMatch.skillGaps,
      explanation,
      disclaimer: 'Simulation based on current profile evidence and benchmark requirements. Estimates do not guarantee hiring or salary outcomes.',
      scoringVersion: SCORING_VERSION,
    },
  };
}

/**
 * Generate human-readable explanation of simulation outcomes
 */
function generateSimulationExplanation({ targetRole, currentScore, simulatedScore, delta, highestAction, categoryImpact, hypotheticalChanges }) {
  if (delta === 0) {
    return `Your simulated profile matches your current ${currentScore}% alignment for ${targetRole}. Select one or more targeted improvements (such as core skills or production projects) to see estimated impact.`;
  }

  const improvedCategories = Object.entries(categoryImpact)
    .filter(([_, v]) => v.delta > 0)
    .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').toLowerCase()} (+${v.delta}%)`);

  let text = `Your estimated match for ${targetRole} increases from ${currentScore}% to ${simulatedScore}% (+${delta} points). `;

  if (highestAction && highestAction.impact > 0) {
    text += `The single highest-impact factor is ${highestAction.title} (+${highestAction.impact} pts). `;
  }

  if (improvedCategories.length > 0) {
    text += `Strongest competency gains occur in ${improvedCategories.join(', ')}.`;
  }

  return text;
}

/**
 * Compare all canonical roles against the student's current profile
 */
async function compareAllRoles(userId) {
  const evidence = await buildStudentEvidence(userId);
  const supportedRoles = getAllSupportedRoles();

  const roleComparisons = supportedRoles.map((r) => {
    const match = calculateCareerMatch(evidence, r.role);
    return {
      role: r.role,
      domain: r.domain,
      matchScore: match.overallMatch,
      confidence: match.confidence,
      strongCount: match.strengths.length,
      gapCount: match.skillGaps.length,
    };
  });

  // Sort descending by match score
  roleComparisons.sort((a, b) => b.matchScore - a.matchScore);

  return {
    success: true,
    data: roleComparisons,
  };
}

/**
 * Save a What-If Scenario to MongoDB for student reference
 */
async function saveScenario(userId, name, targetRole, hypotheticalChanges = {}) {
  const simulation = await simulateScenario(userId, targetRole, hypotheticalChanges);

  const scenario = await CareerScenario.create({
    user: userId,
    name: name || `Simulation: ${targetRole}`,
    targetRole,
    domain: simulation.data.domain,
    hypotheticalChanges,
    simulationResult: {
      currentMatch: simulation.data.currentMatch,
      simulatedMatch: simulation.data.simulatedMatch,
      estimatedImpact: simulation.data.estimatedImpact,
      highestImpactAction: simulation.data.highestImpactAction,
      breakdown: simulation.data.categoryImpact,
    },
    scoringVersion: SCORING_VERSION,
  });

  return {
    success: true,
    data: scenario,
    message: 'Scenario saved successfully to Career Lab.',
  };
}

/**
 * List all saved scenarios for authenticated student
 */
async function getSavedScenarios(userId) {
  const scenarios = await CareerScenario.find({ user: userId }).sort({ createdAt: -1 });
  return {
    success: true,
    data: scenarios,
  };
}

/**
 * Delete a saved scenario
 */
async function deleteSavedScenario(userId, scenarioId) {
  const scenario = await CareerScenario.findOneAndDelete({ _id: scenarioId, user: userId });
  if (!scenario) {
    throw new Error('Scenario not found or unauthorized');
  }
  return {
    success: true,
    message: 'Scenario deleted successfully.',
  };
}

/**
 * Add simulated action items to the student's active Career Roadmap as recommended milestones.
 * GUARANTEE: Does NOT mark items complete or fake user achievements.
 */
async function addScenarioToRoadmap(userId, targetRole, hypotheticalChanges = {}) {
  let roadmap = await CareerRoadmap.findOne({ user: userId, status: 'active' });
  if (!roadmap) {
    const { generateCareerRoadmap } = require('./careerRoadmapService');
    roadmap = await generateCareerRoadmap(userId, targetRole);
  }

  // Create new milestone items from hypothetical changes
  const newItems = [];

  if (Array.isArray(hypotheticalChanges.skills)) {
    hypotheticalChanges.skills.forEach((skill, idx) => {
      newItems.push({
        id: `sim_skill_${Date.now()}_${idx}`,
        title: `Learn & Practice ${skill}`,
        description: `Recommended milestone from Career Lab simulation for ${targetRole}`,
        status: 'Not Started',
        priority: 'High',
      });
    });
  }

  if (Array.isArray(hypotheticalChanges.projects)) {
    hypotheticalChanges.projects.forEach((proj, idx) => {
      newItems.push({
        id: `sim_proj_${Date.now()}_${idx}`,
        title: `Build Project: ${proj.title}`,
        description: proj.description || `Build and deploy project practicing ${proj.technologies?.join(', ')}`,
        status: 'Not Started',
        priority: 'High',
      });
    });
  }

  if (hypotheticalChanges.coding && hypotheticalChanges.coding.additionalSolved > 0) {
    newItems.push({
      id: `sim_code_${Date.now()}`,
      title: `Solve ${hypotheticalChanges.coding.additionalSolved} Algorithmic Challenges`,
      description: `Targeted problem solving milestone for ${targetRole}`,
      status: 'Not Started',
      priority: 'Medium',
    });
  }

  if (newItems.length > 0 && roadmap.roadmapPhases && roadmap.roadmapPhases.length > 0) {
    // Add to Phase 1 or 2 as high priority action items
    const targetPhase = roadmap.roadmapPhases[0];
    targetPhase.items.push(...newItems);
    await roadmap.save();
  }

  return {
    success: true,
    message: `${newItems.length} simulated milestone(s) added to your Career Roadmap.`,
    data: roadmap,
  };
}

module.exports = {
  getCareerLabProfile,
  simulateScenario,
  compareAllRoles,
  saveScenario,
  getSavedScenarios,
  deleteSavedScenario,
  addScenarioToRoadmap,
};
