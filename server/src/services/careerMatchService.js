/**
 * MAVI Career Match Service
 *
 * Provides deterministic, explainable, evidence-based matching of student profiles
 * against structured career role requirements.
 *
 * Scoring Architecture:
 * - Deterministic Match Score (0–100) calculated across 5 weighted categories.
 * - Dynamic weight adjustment for unavailable evidence (no unfair penalties).
 * - Concrete evidence citations for all skills, projects, and platform metrics.
 * - Prioritized next steps linked to Career Roadmap.
 */

const User = require('../models/User');
const Project = require('../models/Project');
const DNA = require('../models/DNA');
const LeetCodeAnalytics = require('../models/LeetCodeAnalytics');
const CareerRoadmap = require('../models/CareerRoadmap');
const { getRoleRequirement, getAllSupportedRoles } = require('../constants/careerRoleRequirements');
const { normalizeDomain } = require('../constants/domainOptions');

const SCORING_VERSION = '1.0';

/**
 * Normalizes and aggregates all real student evidence from MongoDB.
 */
async function buildStudentEvidence(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw new Error('User not found');

  const [projects, dna, leetcode, roadmap] = await Promise.all([
    Project.find({ user: userId }).lean(),
    DNA.findOne({ userId }).lean(),
    LeetCodeAnalytics.findOne({ user: userId }).lean(),
    CareerRoadmap.findOne({ user: userId, status: 'active' }).lean(),
  ]);

  // Extract all verified and declared skills
  const skillsList = (user.skillsList || []).map((s) => ({
    name: s.name.trim(),
    level: s.level || 'Intermediate',
    verified: Boolean(s.verified),
    category: s.category || 'General',
  }));

  // Extract skills from project technologies
  const projectSkillsMap = {};
  for (const proj of projects) {
    const techs = Array.isArray(proj.technologies) ? proj.technologies : [];
    for (const tech of techs) {
      const clean = tech.trim();
      if (!clean) continue;
      const lower = clean.toLowerCase();
      if (!projectSkillsMap[lower]) {
        projectSkillsMap[lower] = { name: clean, projects: [] };
      }
      projectSkillsMap[lower].projects.push(proj.title);
    }
  }

  // Extract GitHub languages from platformData if available
  const githubData = user.platformData?.github || {};
  const githubLanguages = Array.isArray(githubData.topLanguages)
    ? githubData.topLanguages.map((l) => (typeof l === 'string' ? l : l.name || ''))
    : [];

  // Coding platform metrics
  const leetcodeSolved = leetcode?.totalSolved || user.platformData?.leetcode?.totalSolved || user.platformData?.leetcode?.solved || 0;
  const codeforcesRating = user.platformData?.codeforces?.rating || 0;

  return {
    user: {
      id: user._id,
      name: user.name,
      maviId: user.maviId,
      preferredRole: user.preferredRole || 'Full-Stack Developer',
      preferredDomain: user.preferredDomain || 'Software Development',
      profileCompletion: user.profileCompletion || 0,
      scores: user.scores || { overall: 0, development: 0, problemSolving: 0, knowledge: 0 },
      platforms: user.platforms || {},
    },
    skillsList,
    projectSkillsMap,
    githubLanguages,
    projects: projects.map((p) => ({
      id: p._id,
      title: p.title,
      description: p.description || '',
      technologies: p.technologies || [],
      githubRepo: p.githubRepo || '',
      liveUrl: p.liveUrl || '',
    })),
    dna: dna
      ? {
          personalityType: dna.personalityType,
          workingStyle: dna.workingStyle,
          strengths: dna.strengths || [],
          scores: dna.scores || {},
        }
      : null,
    coding: {
      leetcodeSolved,
      leetcodeEasy: leetcode?.easySolved || 0,
      leetcodeMedium: leetcode?.mediumSolved || 0,
      leetcodeHard: leetcode?.hardSolved || 0,
      codeforcesRating,
      isConnected: Boolean(user.platforms?.leetcode?.username || user.platforms?.codeforces?.username || leetcodeSolved > 0),
    },
    github: {
      isConnected: Boolean(user.platforms?.github?.username || user.githubUsername),
      username: user.platforms?.github?.username || user.githubUsername || null,
      languages: githubLanguages,
      repoCount: githubData.publicRepos || githubData.repoCount || 0,
      stars: githubData.totalStars || 0,
      commits: githubData.totalCommits || 0,
    },
    roadmap: roadmap
      ? {
          overallProgress: roadmap.overallProgress || 0,
          readinessScore: roadmap.readinessScore || 0,
        }
      : null,
  };
}

/**
 * Calculates a match for a single skill against student evidence.
 */
function evaluateSkillMatch(skillName, evidence) {
  const targetLower = skillName.toLowerCase();
  const sources = [];
  let score = 0; // 0 to 100

  // 1. Check explicit skills list
  const inSkillsList = evidence.skillsList.find(
    (s) => s.name.toLowerCase() === targetLower || targetLower.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(targetLower)
  );
  if (inSkillsList) {
    score += inSkillsList.level === 'Advanced' ? 65 : inSkillsList.level === 'Intermediate' ? 50 : 35;
    sources.push(`Declared Skill (${inSkillsList.level})`);
  }

  // 2. Check projects usage
  for (const [projTechLower, projData] of Object.entries(evidence.projectSkillsMap)) {
    if (projTechLower === targetLower || targetLower.includes(projTechLower) || projTechLower.includes(targetLower)) {
      const projCount = projData.projects.length;
      score += Math.min(projCount * 25, 45);
      sources.push(`Used in ${projCount} project(s): ${projData.projects.slice(0, 2).join(', ')}`);
      break;
    }
  }

  // 2b. Check project descriptions for implicit keyword usage (e.g. "REST APIs", "Authentication")
  if (sources.length === 0 && evidence.projects) {
    const matchingProject = evidence.projects.find((p) =>
      `${p.title} ${p.description}`.toLowerCase().includes(targetLower)
    );
    if (matchingProject) {
      score += 40;
      sources.push(`Referenced in project "${matchingProject.title}"`);
    }
  }

  // 3. Check GitHub languages
  const inGithub = evidence.githubLanguages.find(
    (lang) => lang.toLowerCase() === targetLower || targetLower.includes(lang.toLowerCase())
  );
  if (inGithub) {
    score += 25;
    sources.push(`GitHub Language: ${inGithub}`);
  }

  score = Math.min(score, 100);

  let status = 'missing';
  if (score >= 50) {
    status = 'strong';
  } else if (score > 0) {
    status = 'partial';
  }

  return {
    skill: skillName,
    score,
    status,
    confidence: sources.length >= 2 ? 'High' : sources.length === 1 ? 'Medium' : 'Low',
    sources,
  };
}

/**
 * Calculates full deterministic career match for given target role and student evidence.
 */
function calculateCareerMatch(evidence, targetRole) {
  const roleReq = getRoleRequirement(targetRole);

  // ─── 1. Technical Skills Evaluation ──────────────────────────────────────
  const requiredEvaluations = roleReq.requiredSkills.map((s) => evaluateSkillMatch(s, evidence));
  const preferredEvaluations = roleReq.preferredSkills.map((s) => evaluateSkillMatch(s, evidence));

  const strongSkills = [];
  const partialSkills = [];
  const missingSkills = [];

  for (const ev of requiredEvaluations) {
    if (ev.status === 'strong') strongSkills.push(ev);
    else if (ev.status === 'partial') partialSkills.push(ev);
    else missingSkills.push(ev);
  }

  for (const ev of preferredEvaluations) {
    if (ev.status === 'strong' && !strongSkills.some((s) => s.skill === ev.skill)) {
      strongSkills.push(ev);
    } else if (ev.status === 'partial' && !partialSkills.some((s) => s.skill === ev.skill)) {
      partialSkills.push(ev);
    }
  }

  const reqScoreSum = requiredEvaluations.reduce((acc, curr) => acc + curr.score, 0);
  const reqScoreAvg = requiredEvaluations.length > 0 ? reqScoreSum / requiredEvaluations.length : 0;
  const prefBonus = Math.min(preferredEvaluations.filter((e) => e.status === 'strong').length * 4, 15);
  const technicalSkillsScore = Math.min(Math.round(reqScoreAvg * 0.85 + prefBonus), 100);

  // ─── 2. Problem Solving Evaluation ───────────────────────────────────────
  const psEvidence = [];
  let problemSolvingScore = 0;
  let psAvailable = evidence.coding.isConnected;

  if (evidence.coding.isConnected) {
    const solved = evidence.coding.leetcodeSolved;
    const benchmark = roleReq.psBenchmark || 60;
    const solveRatio = Math.min((solved / benchmark) * 70, 70);
    const mScoreRatio = Math.min(((evidence.user.scores.problemSolving || 0) / 800) * 30, 30);
    problemSolvingScore = Math.min(Math.round(solveRatio + mScoreRatio), 100);
    psEvidence.push(`${solved} coding problems solved (Target Benchmark: ${benchmark})`);
    if (evidence.user.scores.problemSolving > 0) {
      psEvidence.push(`MAVI Problem Solving Index: ${evidence.user.scores.problemSolving}/1000`);
    }
  } else if (evidence.user.scores.problemSolving > 0) {
    problemSolvingScore = Math.min(Math.round((evidence.user.scores.problemSolving / 800) * 100), 100);
    psEvidence.push(`Evaluated from internal assessment score: ${evidence.user.scores.problemSolving}`);
    psAvailable = true;
  } else {
    // Graceful fallback — derive from general technical readiness without 0 penalty
    problemSolvingScore = Math.max(technicalSkillsScore - 15, 30);
    psEvidence.push('Coding platform not linked — Connect LeetCode/Codeforces for verified score');
    psAvailable = false;
  }

  // ─── 3. Project Portfolio Evaluation ─────────────────────────────────────
  const projEvidence = [];
  const projectCount = evidence.projects.length;
  const minRequired = roleReq.projectThreshold || 2;
  const countScore = Math.min((projectCount / minRequired) * 50, 50);

  // Match project technologies & descriptions with role keywords
  let relevantProjectsCount = 0;
  for (const proj of evidence.projects) {
    const combinedText = `${proj.title} ${proj.description} ${proj.technologies.join(' ')}`.toLowerCase();
    const isRelevant = roleReq.projectKeywords.some((kw) => combinedText.includes(kw.toLowerCase()));
    if (isRelevant) {
      relevantProjectsCount++;
    }
  }

  const relevanceScore = Math.min((relevantProjectsCount / Math.max(minRequired, 1)) * 35, 35);
  const liveLinkBonus = evidence.projects.some((p) => p.githubRepo || p.liveUrl) ? 15 : 0;
  const projectsScore = Math.min(Math.round(countScore + relevanceScore + liveLinkBonus), 100);

  projEvidence.push(`${projectCount} project(s) documented (${relevantProjectsCount} role-aligned)`);
  if (liveLinkBonus > 0) projEvidence.push('Repository / Live demo verified');

  // ─── 4. Development Activity & GitHub Evaluation ────────────────────────
  const devEvidence = [];
  let devScore = 0;
  let devAvailable = evidence.github.isConnected;

  if (evidence.github.isConnected) {
    const baseDev = Math.min(((evidence.user.scores.development || 0) / 800) * 70, 70);
    const repoBonus = Math.min(evidence.github.repoCount * 4, 15);
    const langBonus = Math.min(evidence.github.languages.length * 3, 15);
    devScore = Math.min(Math.round(baseDev + repoBonus + langBonus), 100);
    devEvidence.push(`GitHub @${evidence.github.username} linked (${evidence.github.repoCount} public repos)`);
    devEvidence.push(`Languages detected: ${evidence.github.languages.slice(0, 4).join(', ') || 'Various'}`);
  } else if (evidence.user.scores.development > 0) {
    devScore = Math.min(Math.round((evidence.user.scores.development / 800) * 100), 100);
    devEvidence.push(`Evaluated from internal project development score: ${evidence.user.scores.development}`);
    devAvailable = true;
  } else {
    devScore = Math.max(projectsScore - 10, 35);
    devEvidence.push('GitHub profile not linked — Connect GitHub for real-time intelligence');
    devAvailable = false;
  }

  // ─── 5. Profile & Career Readiness Evaluation ────────────────────────────
  const profileEvidence = [];
  const profileBase = (evidence.user.profileCompletion || 50) * 0.5;
  const roadmapBonus = (evidence.roadmap?.overallProgress || 0) * 0.3;
  let dnaBonus = 10;
  if (evidence.dna?.personalityType && roleReq.dnaArchetypes.includes(evidence.dna.personalityType)) {
    dnaBonus = 20;
    profileEvidence.push(`Developer DNA (${evidence.dna.personalityType}) aligns strongly with ${roleReq.title}`);
  }
  const profileScore = Math.min(Math.round(profileBase + roadmapBonus + dnaBonus), 100);
  profileEvidence.push(`Profile completion: ${evidence.user.profileCompletion}%`);

  // ─── 6. Deterministic Weighted Overall Score Calculation ────────────────
  // Configured Baseline Weights:
  // Technical Skills: 30%
  // Problem Solving: 20%
  // Projects: 20%
  // Development Activity: 15%
  // Profile & DNA: 15%
  let totalWeightedScore = 0;
  let totalWeight = 0;

  const weights = {
    technicalSkills: 30,
    problemSolving: psAvailable ? 20 : 10,
    projects: 20,
    developmentActivity: devAvailable ? 15 : 10,
    profile: 15,
  };

  totalWeightedScore += technicalSkillsScore * weights.technicalSkills;
  totalWeight += weights.technicalSkills;

  totalWeightedScore += problemSolvingScore * weights.problemSolving;
  totalWeight += weights.problemSolving;

  totalWeightedScore += projectsScore * weights.projects;
  totalWeight += weights.projects;

  totalWeightedScore += devScore * weights.developmentActivity;
  totalWeight += weights.developmentActivity;

  totalWeightedScore += profileScore * weights.profile;
  totalWeight += weights.profile;

  const overallMatch = Math.round(totalWeightedScore / totalWeight);

  // ─── 7. Confidence Score Assessment ──────────────────────────────────────
  let confidence = 'High';
  let dataSignals = 0;
  if (evidence.github.isConnected) dataSignals += 2;
  if (evidence.coding.isConnected) dataSignals += 2;
  if (evidence.projects.length >= 2) dataSignals += 2;
  if (evidence.skillsList.length >= 4) dataSignals += 2;
  if (evidence.dna) dataSignals += 1;

  if (dataSignals >= 6) confidence = 'High';
  else if (dataSignals >= 3) confidence = 'Medium';
  else confidence = 'Low';

  // ─── 8. Actionable Prioritized Next Steps ─────────────────────────────────
  const recommendations = [];

  // Top skill gaps recommendation
  if (missingSkills.length > 0) {
    const topMissing = missingSkills.slice(0, 2).map((s) => s.skill).join(' and ');
    recommendations.push({
      priority: 1,
      title: `Close Technical Skill Gap in ${topMissing}`,
      description: `Target role ${roleReq.title} prioritizes ${topMissing}. Build a dedicated mini-project or complete hands-on tutorials.`,
      type: 'skill',
    });
  }

  // Project recommendation
  if (projectCount < minRequired) {
    recommendations.push({
      priority: 2,
      title: `Build a Dedicated ${roleReq.title} Project`,
      description: `Create an end-to-end project applying ${roleReq.requiredSkills.slice(0, 3).join(', ')} with a live public GitHub repository.`,
      type: 'project',
    });
  } else if (evidence.projects.length > 0) {
    const targetProject = evidence.projects[0];
    const topGap = missingSkills[0]?.skill || roleReq.preferredSkills[0];
    recommendations.push({
      priority: 2,
      title: `Enhance "${targetProject.title}" with ${topGap}`,
      description: `Integrate ${topGap} into your existing "${targetProject.title}" project to demonstrate industry-grade full-lifecycle engineering.`,
      type: 'project',
    });
  }

  // Coding or Platform connection recommendation
  if (!evidence.coding.isConnected) {
    recommendations.push({
      priority: 3,
      title: 'Connect Coding Profile (LeetCode / Codeforces)',
      description: 'Link your problem-solving accounts to verify your algorithmic strength and increase match confidence.',
      type: 'platform',
    });
  } else if (problemSolvingScore < 70) {
    recommendations.push({
      priority: 3,
      title: 'Target Medium Algorithmic Problem Solving',
      description: `Solve 15–20 medium problems in core data structures (Arrays, Trees, Dynamic Programming) to reach target benchmark.`,
      type: 'problem_solving',
    });
  }

  // Add role-specific default action
  if (roleReq.recommendedActions && roleReq.recommendedActions.length > 0) {
    recommendations.push({
      priority: 4,
      title: 'Target Role Best Practice',
      description: roleReq.recommendedActions[0],
      type: 'career',
    });
  }

  return {
    version: SCORING_VERSION,
    targetRole: roleReq.title,
    domain: roleReq.domain,
    overallMatch: Math.min(Math.max(overallMatch, 0), 100),
    confidence,
    breakdown: {
      technicalSkills: {
        score: technicalSkillsScore,
        weight: '30%',
        description: 'Match against required and preferred technical competencies',
      },
      problemSolving: {
        score: problemSolvingScore,
        weight: '20%',
        available: psAvailable,
        evidence: psEvidence,
      },
      projects: {
        score: projectsScore,
        weight: '20%',
        evidence: projEvidence,
      },
      developmentActivity: {
        score: devScore,
        weight: '15%',
        available: devAvailable,
        evidence: devEvidence,
      },
      profile: {
        score: profileScore,
        weight: '15%',
        evidence: profileEvidence,
      },
    },
    strengths: strongSkills.map((s) => ({
      skill: s.skill,
      score: s.score,
      evidence: s.sources.join(' • '),
    })),
    partialMatch: partialSkills.map((s) => ({
      skill: s.skill,
      score: s.score,
      evidence: s.sources.join(' • '),
    })),
    skillGaps: missingSkills.map((s) => ({
      skill: s.skill,
      importance: 'Required for Target Role',
      recommendation: `Learn ${s.skill} and document in a project`,
    })),
    recommendations: recommendations.slice(0, 4),
    evidenceSummary: {
      projectsCount: projectCount,
      skillsCount: evidence.skillsList.length,
      githubConnected: evidence.github.isConnected,
      codingConnected: evidence.coding.isConnected,
      dnaArchetype: evidence.dna?.personalityType || 'General Developer',
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * High-level service: get career match for student.
 */
async function getStudentCareerMatch(userId, requestedRole = null) {
  const evidence = await buildStudentEvidence(userId);
  const targetRole = requestedRole || evidence.user.preferredRole || 'Full-Stack Developer';
  const matchResult = calculateCareerMatch(evidence, targetRole);

  return {
    success: true,
    data: matchResult,
    supportedRoles: getAllSupportedRoles(),
  };
}

/**
 * Updates target role on student profile and recalculates match.
 */
async function updateStudentTargetRole(userId, newRole) {
  if (!newRole || typeof newRole !== 'string') {
    throw new Error('Valid target role string is required');
  }

  const roleReq = getRoleRequirement(newRole);
  const canonicalDomain = normalizeDomain(roleReq.domain);

  await User.findByIdAndUpdate(userId, {
    preferredRole: roleReq.title,
    preferredDomain: canonicalDomain,
  });

  return getStudentCareerMatch(userId, roleReq.title);
}

module.exports = {
  SCORING_VERSION,
  buildStudentEvidence,
  calculateCareerMatch,
  getStudentCareerMatch,
  updateStudentTargetRole,
  getAllSupportedRoles,
};
