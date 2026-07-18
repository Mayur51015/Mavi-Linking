const User = require('../models/User');
const Project = require('../models/Project');
const Badge = require('../models/Badge');
const TimelineEvent = require('../models/TimelineEvent');

/**
 * Calculates a 1000-point performance score and updates user.scores.overall
 */
const calculatePerformanceScore = async (user, projects) => {
  let score = 0;

  // 1. Coding Activity (300 pts)
  const pd = user.platformData || {};
  let codingScore = 0;
  if (pd.github) {
    codingScore += Math.min((pd.github.publicRepos || 0) * 10, 100);
    codingScore += Math.min((pd.github.followers || 0) * 5, 50);
  }
  if (pd.leetcode) {
    codingScore += Math.min((pd.leetcode.solved || 0) * 2, 100);
  }
  if (pd.codeforces) {
    codingScore += Math.min(Math.floor((pd.codeforces.rating || 0) / 10), 50);
  }
  score += Math.min(codingScore, 300);

  // 2. Projects Quality (250 pts)
  let projScore = 0;
  projScore += Math.min(projects.length * 30, 150);
  projects.forEach(p => {
    if (p.liveUrl) projScore += 10;
    if (p.githubUrl) projScore += 5;
    if (p.technologies && p.technologies.length >= 3) projScore += 5;
  });
  score += Math.min(projScore, 250);

  // 3. Academic Performance (150 pts)
  // Assuming we might have CGPA in user profile, if not, fallback to university presence
  let acadScore = 0;
  if (user.university && user.university.name) acadScore += 75;
  if (user.degree) acadScore += 75;
  score += Math.min(acadScore, 150);

  // 4. Profile & Resume (150 pts)
  let profScore = 0;
  if (user.bio && user.bio.length > 20) profScore += 30;
  if (user.skillsList && user.skillsList.length > 3) profScore += 40;
  const hasResume = user.portfolioDocs?.some(doc => doc.category === 'Resume');
  if (hasResume) profScore += 80;
  score += Math.min(profScore, 150);

  // 5. Extracurriculars (150 pts)
  let extraScore = 0;
  if (user.certificates) {
    extraScore += Math.min(user.certificates.length * 20, 80);
  }
  if (user.achievements) {
    extraScore += Math.min(user.achievements.length * 35, 70);
  }
  score += Math.min(extraScore, 150);

  return Math.min(score, 1000);
};

const generateAIAnalysis = (user, score, projects) => {
  const strengths = [];
  const weaknesses = [];
  const recommendedRoles = [];

  // Strengths
  if (score > 700) strengths.push("Consistently high performer across domains");
  if (projects.length >= 3) strengths.push("Strong project portfolio demonstrating practical skills");
  if (user.platformData?.leetcode?.solved > 50) strengths.push("Good grasp of Data Structures & Algorithms");
  if (user.platformData?.github?.publicRepos > 10) strengths.push("Active open-source contributor");
  
  // Weaknesses
  if (projects.length === 0) weaknesses.push("Lacks practical project experience");
  const hasResume = user.portfolioDocs?.some(doc => doc.category === 'Resume');
  if (!hasResume) weaknesses.push("Resume is missing, urgently requires upload");
  if (!user.platformData?.leetcode && !user.platformData?.codeforces) weaknesses.push("No competitive programming or algorithmic coding presence");

  // Roles
  const allTech = projects.flatMap(p => p.technologies || []).map(t => t.toLowerCase());
  if (allTech.some(t => ['react', 'vue', 'angular', 'css'].includes(t))) recommendedRoles.push("Frontend Developer");
  if (allTech.some(t => ['node', 'express', 'django', 'spring', 'mongodb', 'sql'].includes(t))) recommendedRoles.push("Backend Developer");
  if (recommendedRoles.includes("Frontend Developer") && recommendedRoles.includes("Backend Developer")) recommendedRoles.push("Full Stack Engineer");
  if (allTech.some(t => ['python', 'tensorflow', 'pytorch', 'machine learning', 'ai'].includes(t))) recommendedRoles.push("AI/ML Engineer");

  if (recommendedRoles.length === 0) recommendedRoles.push("Software Engineer");

  let hiringRecommendation = "Needs Mentoring";
  if (score > 800) hiringRecommendation = "Highly Recommended - Ready for Top Tier";
  else if (score > 600) hiringRecommendation = "Placement Ready";
  else if (score > 400) hiringRecommendation = "Potential Candidate - Needs Polish";

  return { strengths, weaknesses, recommendedRoles, hiringRecommendation };
};

const checkAndAwardBadges = async (user, projects) => {
  const newBadges = [];
  const existingBadges = await Badge.find({ user: user._id }).lean();
  const existingBadgeIds = existingBadges.map(b => b.badgeId);

  const award = async (badgeId, name, icon) => {
    if (!existingBadgeIds.includes(badgeId)) {
      await Badge.create({ user: user._id, badgeId, name, icon });
      await TimelineEvent.create({
        user: user._id,
        type: 'BADGE',
        title: `Earned Badge: ${name}`,
        description: `You were awarded the ${name} badge!`,
      });
      newBadges.push(badgeId);
    }
  };

  if (user.isVerified) await award('VERIFIED', 'Verified Student', 'CheckCircle');
  
  const hasResume = user.portfolioDocs?.some(doc => doc.category === 'Resume');
  if (hasResume) await award('RESUME_COMPLETE', 'Resume Complete', 'FileText');
  
  if (user.platformData?.github) await award('GITHUB_CONNECTED', 'GitHub Connected', 'Github');
  
  if (user.platformData?.github?.publicRepos >= 10) await award('OPEN_SOURCE', 'Open Source Contributor', 'GitMerge');
  
  if (user.platformData?.leetcode?.solved >= 100) await award('LEETCODE_100', '100 LeetCode Problems', 'Code2');
  
  if (projects.length >= 3) await award('PROJECT_BUILDER', 'Project Builder', 'Briefcase');
  
  const hasHackathon = user.achievements?.some(a => a.category === 'Hackathon');
  if (hasHackathon) await award('HACKATHON_WINNER', 'Hackathon Participant', 'Trophy');

  return newBadges;
};

/**
 * Main entry point to recalculate a user's career intelligence profile.
 */
const evaluateUserIntelligence = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const projects = await Project.find({ user: userId });

  const score = await calculatePerformanceScore(user, projects);
  const aiAnalysis = generateAIAnalysis(user, score, projects);
  
  let profileCompletion = 0;
  if (user.avatar) profileCompletion += 10;
  if (user.bio) profileCompletion += 10;
  if (user.university?.name) profileCompletion += 20;
  if (user.platforms?.github?.username) profileCompletion += 15;
  if (projects.length > 0) profileCompletion += 15;
  if (user.certificates?.length > 0) profileCompletion += 15;
  if (user.portfolioDocs?.length > 0) profileCompletion += 15;
  profileCompletion = Math.min(profileCompletion, 100);

  // Update user
  user.scores = user.scores || {};
  user.scores.overall = score;
  user.aiAnalysis = aiAnalysis;
  user.placementReadinessScore = Math.floor((score / 1000) * 100);
  user.profileCompletion = profileCompletion;
  
  await user.save();

  // Check badges
  await checkAndAwardBadges(user, projects);
  
  return user;
};

module.exports = {
  evaluateUserIntelligence,
};
