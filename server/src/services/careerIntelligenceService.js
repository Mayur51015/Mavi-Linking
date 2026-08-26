const User = require('../models/User');
const Project = require('../models/Project');
const Badge = require('../models/Badge');
const TimelineEvent = require('../models/TimelineEvent');
const CareerScore = require('../models/CareerScore');
const CareerTimeline = require('../models/CareerTimeline');
const CareerBadge = require('../models/CareerBadge');
const CareerInsight = require('../models/CareerInsight');
const CareerAnalytics = require('../models/CareerAnalytics');
const { getIO } = require('../config/socket');

const { calculateUnifiedOverallScore } = require('./scoreService');

/**
 * Calculates a comprehensive 1000-point performance score and individual category scores
 * using the canonical unified scoring engine from scoreService.js.
 */
const calculatePerformanceScore = async (user, projects) => {
  const unifiedScores = calculateUnifiedOverallScore(user, projects);
  return {
    overall: unifiedScores.overall,
    development: unifiedScores.development,
    problemSolving: unifiedScores.problemSolving,
    community: unifiedScores.community,
    developmentBreakdown: unifiedScores.developmentBreakdown,
    breakdown: {
      academics: user.cgpa ? Math.min(Math.round(user.cgpa * 15), 150) : 80,
      profileCompletion: Math.min(Math.round((user.profileCompletion || 0)), 100),
      resume: user.portfolioDocs?.some(doc => doc.category === 'Resume') ? 100 : 0,
      projects: Math.min(projects.length * 20, 100),
      certificates: Math.min((user.certificates?.length || 0) * 10, 50),
      platforms: (user.platforms?.github?.username ? 50 : 0) + (user.platforms?.leetcode?.username ? 50 : 0) + (user.platforms?.codeforces?.username ? 50 : 0),
    }
  };
};

/**
 * Generates dynamic AI insights based on actual user data
 */
const generateAIAnalysis = (user, scoreData, projects) => {
  const strengths = [];
  const weaknesses = [];
  const recommendedRoles = [];

  // Evaluate Strengths
  if (scoreData.overall > 750) strengths.push("Outstanding academic and career profile");
  if (projects.length >= 3) strengths.push("Strong project portfolio showing build experience");
  if (projects.some(p => p.liveUrl)) strengths.push("Proven track record of deploying applications");
  
  const pd = user.platformData || {};
  if (pd.github?.followers > 5) strengths.push("Active coding presence on GitHub with community reach");
  if (pd.leetcode?.solved > 80) strengths.push("Strong data structures and algorithms foundation");
  if (pd.codeforces?.rating > 1300) strengths.push("Excellent speed and competitive programming skills");
  
  const hasResume = user.portfolioDocs?.some(doc => doc.category === 'Resume');
  if (hasResume) strengths.push("Professional resume submitted");
  
  const hasInternship = user.portfolioDocs?.some(doc => doc.category === 'Internship');
  if (hasInternship) strengths.push("Practical industry experience via internship");

  // Fallback strengths if empty
  if (strengths.length === 0) {
    strengths.push("Eager learner with a growing skill set");
  }

  // Evaluate Weaknesses
  if (!hasResume) weaknesses.push("Resume is missing - upload a copy to your portfolio");
  if (projects.length < 3) weaknesses.push("Build more projects to showcase practical abilities");
  if (!pd.leetcode && !pd.codeforces) weaknesses.push("No verified coding presence - link LeetCode / Codeforces");
  if (user.profileCompletion < 80) weaknesses.push("Complete missing profile details to improve search discoverability");
  if (!user.certificates || user.certificates.length === 0) weaknesses.push("Add professional certifications to validate your skills");
  if (user.skillsList?.length < 4) weaknesses.push("List more professional skills on your profile");

  if (weaknesses.length === 0) {
    weaknesses.push("Continue practicing advanced coding problems to maintain edge");
  }

  // Determine Recommended Roles
  const techStack = Array.from(new Set(
    projects.flatMap(p => p.technologies || []).map(t => t.trim().toLowerCase())
  ));

  const isWeb = techStack.some(t => ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript'].includes(t));
  const isBackend = techStack.some(t => ['node', 'express', 'mongodb', 'sql', 'postgres', 'python', 'django', 'java', 'spring', 'go'].includes(t));
  const isAI = techStack.some(t => ['python', 'pytorch', 'tensorflow', 'numpy', 'pandas', 'scikit-learn', 'machine learning', 'ai'].includes(t));

  if (isWeb && isBackend) recommendedRoles.push("Full Stack Engineer");
  else if (isWeb) recommendedRoles.push("Frontend Developer");
  else if (isBackend) recommendedRoles.push("Backend Developer");
  
  if (isAI) recommendedRoles.push("AI/ML Engineer");

  if (recommendedRoles.length === 0) {
    recommendedRoles.push("Software Engineer");
  }

  let hiringRecommendation = "Needs Mentoring";
  if (scoreData.overall > 800) hiringRecommendation = "Highly Recommended - Top Talent";
  else if (scoreData.overall > 600) hiringRecommendation = "Placement Ready";
  else if (scoreData.overall > 400) hiringRecommendation = "Potential Candidate - Needs Polish";

  return { strengths, weaknesses, recommendedRoles, hiringRecommendation };
};

/**
 * Evaluates and awards career badges
 */
const checkAndAwardBadges = async (user, projects, scoreData) => {
  const awardedBadges = [];
  const existingBadges = await CareerBadge.find({ user: user._id }).lean();
  const existingIds = existingBadges.map(b => b.badgeId);

  const award = async (badgeId, name, icon) => {
    if (!existingIds.includes(badgeId)) {
      await CareerBadge.create({ user: user._id, badgeId, name, icon });
      // Duplicate write to legacy Badge collection for backwards-compatibility
      try {
        await Badge.create({ user: user._id, badgeId, name, icon });
      } catch (_) {}

      await TimelineEvent.create({
        user: user._id,
        type: 'BADGE',
        title: `Earned Badge: ${name}`,
        description: `Congratulations! You unlocked the ${name} badge!`,
      });
      await CareerTimeline.create({
        user: user._id,
        type: 'BADGE',
        title: `Earned Badge: ${name}`,
        description: `Congratulations! You unlocked the ${name} badge!`,
      });
      awardedBadges.push(name);
    }
  };

  if (user.isVerified) {
    await award('VERIFIED', 'Verified Student', 'CheckCircle');
  }
  
  if (user.profileCompletion >= 95) {
    await award('PROFILE_COMPLETE', 'Profile Complete', 'Award');
  }

  const hasResume = user.portfolioDocs?.some(doc => doc.category === 'Resume');
  if (hasResume) {
    await award('RESUME_COMPLETE', 'Resume Uploaded', 'FileText');
  }

  const ghUser = user.githubUsername || user.platforms?.github?.username;
  if (ghUser) {
    await award('GITHUB_CONNECTED', 'GitHub Connected', 'Github');
  }

  if (projects.length >= 5) {
    await award('PROJECTS_5', '5 Projects Builder', 'Briefcase');
  }

  if (user.certificates?.length >= 10) {
    await award('CERTIFICATES_10', '10 Certificates Earned', 'Trophy');
  }

  const pd = user.platformData || {};
  if (pd.github?.publicRepos >= 15) {
    await award('GITHUB_COMMITS_100', '100 GitHub Commits', 'GitMerge');
  }

  if (pd.leetcode?.solved >= 100) {
    await award('LEETCODE_100', '100 LeetCode Problems', 'Code2');
  }

  const hasHackathon = user.achievements?.some(a => a.category === 'Hackathon') || user.portfolioDocs?.some(d => d.category === 'Achievement');
  if (hasHackathon) {
    await award('HACKATHON_WINNER', 'Hackathon Winner', 'Trophy');
  }

  const hasInternship = user.portfolioDocs?.some(doc => doc.category === 'Internship');
  if (hasInternship) {
    await award('INTERNSHIP_COMPLETED', 'Internship Completed', 'Briefcase');
  }

  if (scoreData.overall >= 600) {
    await award('PLACEMENT_READY', 'Placement Ready', 'Award');
  }

  return awardedBadges;
};

/**
 * Aggregates views and counts for analytics
 */
const updateAnalytics = async (user, projects) => {
  const currentMonth = new Date().toISOString().substring(0, 7); // e.g. '2026-07'
  const views = 0;
  const codingScore = user.scores?.overall || 0;

  await CareerAnalytics.findOneAndUpdate(
    { user: user._id, month: currentMonth },
    {
      $set: {
        profileViews: views,
        projectCount: projects.length,
        codingScore: codingScore
      }
    },
    { upsert: true, new: true }
  );
};

/**
 * Main recalculation entry point
 */
const evaluateUserIntelligence = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const projects = await Project.find({ user: userId });

  // 1. Calculate Scores
  const scoreData = await calculatePerformanceScore(user, projects);

  // 2. Generate Insights
  const aiAnalysis = generateAIAnalysis(user, scoreData, projects);

  // 3. Update User Document
  user.scores = {
    overall: scoreData.overall,
    development: scoreData.development,
    problemSolving: scoreData.problemSolving,
    community: scoreData.community
  };
  user.aiAnalysis = aiAnalysis;
  user.placementReadinessScore = Math.floor((scoreData.overall / 1000) * 100);

  // Re-calculate profile completion
  let completion = 20; // base
  if (user.avatar) completion += 10;
  if (user.bio) completion += 15;
  if (user.university?.name) completion += 15;
  if (user.githubUsername || user.platforms?.github?.username) completion += 10;
  if (projects.length > 0) completion += 10;
  if (user.certificates?.length > 0) completion += 10;
  if (user.portfolioDocs?.some(d => d.category === 'Resume')) completion += 10;
  user.profileCompletion = Math.min(completion, 100);

  await user.save();

  // 4. Update CareerScore Collection
  await CareerScore.findOneAndUpdate(
    { user: userId },
    {
      overall: scoreData.overall,
      development: scoreData.development,
      problemSolving: scoreData.problemSolving,
      community: scoreData.community,
      breakdown: scoreData.breakdown,
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );

  // 5. Update CareerInsight Collection
  await CareerInsight.findOneAndUpdate(
    { user: userId },
    {
      strengths: aiAnalysis.strengths,
      improvements: aiAnalysis.weaknesses,
      recommendedRoles: aiAnalysis.recommendedRoles,
      hiringRecommendation: aiAnalysis.hiringRecommendation,
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );

  // 6. Award Badges
  await checkAndAwardBadges(user, projects, scoreData);

  // 7. Re-evaluate DNA Profile
  try {
    const aiAnalyzer = require('./aiAnalyzer');
    await aiAnalyzer.analyzeUser(user);
  } catch (err) {
    console.warn('DNA Re-eval error:', err.message);
  }

  // 8. Update Analytics
  await updateAnalytics(user, projects);

  // 9. Broadcast update
  try {
    const io = getIO();
    io.to(userId.toString()).emit('career_update', { userId });
  } catch (err) {
    console.warn('Socket IO emit failed in evaluateUserIntelligence:', err.message);
  }

  return user;
};

module.exports = {
  evaluateUserIntelligence,
};
