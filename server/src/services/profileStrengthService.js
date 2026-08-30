/**
 * Unified MAVI Profile Strength & Completion Service
 *
 * Single Source of Truth for calculating profile strength, completeness,
 * and identifying missing profile requirements across MAVI Linking.
 */

const User = require('../models/User');
const Project = require('../models/Project');

/**
 * Calculates current profile strength (0–100) and missing items list.
 *
 * Categories & Max Weights:
 * - Technical Skills: 25 pts
 * - Projects Portfolio: 25 pts
 * - Resume & Documents: 15 pts
 * - Academic / Institutional: 10 pts
 * - Identity, Bio & Career Goal: 15 pts
 * - Platforms & Developer Profiles: 10 pts
 * Total: 100 pts
 *
 * @param {Object} user - User document or plain object
 * @param {Array} projects - Array of Project documents
 * @returns {Object} { profileStrength: number, missingProfileItems: string[], breakdown: Object }
 */
const calculateProfileStrength = (user, projects = []) => {
  if (!user) {
    return {
      profileStrength: 0,
      missingProfileItems: ['User Profile'],
      breakdown: {},
    };
  }

  let score = 0;
  const missingItems = [];
  const breakdown = {};

  // ─── 1. Identity, Bio & Career Goal (15 pts) ──────────────────────────────
  let identityScore = 0;
  if (user.name && user.name.trim().length >= 2) identityScore += 5;
  if (user.bio && user.bio.trim().length >= 5) identityScore += 4;
  if (user.avatar && user.avatar.trim().length > 0) identityScore += 3;
  if (user.preferredRole || user.preferredDomain) identityScore += 3;

  identityScore = Math.min(identityScore, 15);
  score += identityScore;
  breakdown.identity = identityScore;

  if (!user.bio || user.bio.trim().length < 5) {
    if (!user.avatar) {
      missingItems.push('Profile Bio & Photo');
    }
  }

  // ─── 2. Technical Skills (25 pts) ─────────────────────────────────────────
  // Aggregate skills from: user.skillsList, user.skills, user.developerSkills,
  // projects tech stack, and GitHub detected languages.
  const rawSkills = new Set();

  if (Array.isArray(user.skillsList)) {
    user.skillsList.forEach((s) => {
      const name = typeof s === 'string' ? s : s?.name;
      if (name && name.trim()) rawSkills.add(name.trim().toLowerCase());
    });
  }

  if (Array.isArray(user.skills)) {
    user.skills.forEach((s) => {
      const name = typeof s === 'string' ? s : s?.name;
      if (name && name.trim()) rawSkills.add(name.trim().toLowerCase());
    });
  }

  if (Array.isArray(user.developerSkills)) {
    user.developerSkills.forEach((s) => {
      const name = typeof s === 'string' ? s : s?.name;
      if (name && name.trim()) rawSkills.add(name.trim().toLowerCase());
    });
  }

  // Also extract technologies from student projects
  if (Array.isArray(projects)) {
    projects.forEach((p) => {
      const techs = p.technologies || p.techStack || [];
      if (Array.isArray(techs)) {
        techs.forEach((t) => {
          if (t && typeof t === 'string' && t.trim()) {
            rawSkills.add(t.trim().toLowerCase());
          }
        });
      }
    });
  }

  // Also extract languages detected from GitHub
  const githubLangs = user.platformData?.github?.languages || user.platformData?.github?.topLanguages || [];
  if (Array.isArray(githubLangs)) {
    githubLangs.forEach((l) => {
      if (l && typeof l === 'string' && l.trim()) {
        rawSkills.add(l.trim().toLowerCase());
      }
    });
  }

  const distinctSkillsCount = rawSkills.size;
  let skillsScore = 0;

  if (distinctSkillsCount >= 3) {
    skillsScore = 25;
  } else if (distinctSkillsCount >= 1) {
    skillsScore = 15;
    missingItems.push('Add more skills (at least 3)');
  } else {
    skillsScore = 0;
    missingItems.push('Technical Skills');
  }

  score += skillsScore;
  breakdown.skills = skillsScore;

  // ─── 3. Projects Portfolio (25 pts) ───────────────────────────────────────
  // Aggregate projects from Project collection + embedded user.projects
  let allProjects = Array.isArray(projects) ? [...projects] : [];
  if (Array.isArray(user.projects) && user.projects.length > 0) {
    allProjects = [...allProjects, ...user.projects];
  }

  let projectsScore = 0;
  if (allProjects.length >= 2) {
    projectsScore = 25;
  } else if (allProjects.length === 1) {
    const single = allProjects[0];
    const isDetailed =
      (single.description && single.description.trim().length >= 15) ||
      (single.technologies && single.technologies.length >= 2) ||
      single.githubRepo ||
      single.liveUrl;
    projectsScore = isDetailed ? 25 : 20;
  } else {
    projectsScore = 0;
    missingItems.push('Projects');
  }

  score += projectsScore;
  breakdown.projects = projectsScore;

  // ─── 4. Resume & Verification Documents (15 pts) ──────────────────────────
  const hasResume =
    (Array.isArray(user.portfolioDocs) && user.portfolioDocs.some((d) => d.category === 'Resume' || (d.title && d.title.toLowerCase().includes('resume')))) ||
    (user.documents && user.documents.resume && user.documents.resume.trim().length > 0) ||
    (user.documents && Array.isArray(user.documents.list) && user.documents.list.some((d) => d.type?.toLowerCase() === 'resume' || d.title?.toLowerCase().includes('resume'))) ||
    (user.resumeUrl && user.resumeUrl.trim().length > 0) ||
    (user.resume && typeof user.resume === 'string' && user.resume.trim().length > 0);

  const resumeScore = hasResume ? 15 : 0;
  score += resumeScore;
  breakdown.resume = resumeScore;

  if (!hasResume) {
    missingItems.push('Resume');
  }

  // ─── 5. Academic & Institutional Information (10 pts) ─────────────────────
  const hasAcademic = Boolean(
    user.university?.name ||
    user.collegeName ||
    user.institutionId ||
    user.degree ||
    user.departmentId ||
    user.university?.department ||
    user.university?.branch ||
    user.prn ||
    (user.cgpa && user.cgpa > 0) ||
    user.academicInfo
  );

  const academicScore = hasAcademic ? 10 : 0;
  score += academicScore;
  breakdown.academic = academicScore;

  if (!hasAcademic) {
    missingItems.push('Academic Information');
  }

  // ─── 6. Developer Platform Connections (10 pts) ───────────────────────────
  const hasGithub = Boolean(
    user.githubUsername ||
    user.platforms?.github?.username ||
    user.platformData?.github
  );

  const hasCodingPlatform = Boolean(
    user.platforms?.leetcode?.username ||
    user.platforms?.codeforces?.username ||
    user.platforms?.stackoverflow?.username ||
    user.platformData?.leetcode ||
    user.platformData?.codeforces ||
    allProjects.some((p) => p.githubRepo || p.liveUrl)
  );

  let platformScore = 0;
  if (hasGithub) {
    platformScore += 7;
    if (hasCodingPlatform) platformScore += 3;
    else platformScore += 3; // GitHub alone satisfies platform requirement if active
  } else if (hasCodingPlatform) {
    platformScore = 7;
  }

  platformScore = Math.min(platformScore, 10);
  score += platformScore;
  breakdown.platforms = platformScore;

  if (!hasGithub && !hasCodingPlatform) {
    missingItems.push('GitHub Profile');
  }

  const finalStrength = Math.min(Math.max(Math.round(score), 0), 100);

  return {
    profileStrength: finalStrength,
    missingProfileItems: missingItems,
    breakdown,
  };
};

/**
 * Recalculate and synchronize user.profileCompletion in MongoDB.
 *
 * @param {string} userId
 * @returns {Promise<number>} Updated profile completion percentage
 */
const syncUserProfileCompletion = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return 0;

    const projects = await Project.find({ user: userId });
    const { profileStrength } = calculateProfileStrength(user, projects);

    user.profileCompletion = profileStrength;
    await user.save({ validateModifiedOnly: true });

    return profileStrength;
  } catch (error) {
    console.error('Error synchronizing user profile completion:', error.message);
    return 0;
  }
};

module.exports = {
  calculateProfileStrength,
  syncUserProfileCompletion,
};
