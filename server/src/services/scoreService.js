/**
 * Unified Canonical Scoring Engine for MAVI Linking
 * Provides transparent, deterministic, and explainable developer scores (0–1000).
 */

/**
 * Calculate the Development Score based on verified engineering signals.
 * Max score: 1000
 *
 * Weight Architecture:
 * 1. Development Activity: 25% (max 250)
 * 2. Project Experience:    25% (max 250)
 * 3. Technical Breadth:     15% (max 150)
 * 4. Collaboration:         15% (max 150)
 * 5. Open Source:           10% (max 100)
 * 6. Software Delivery:      5% (max 50)
 * 7. Consistency:            5% (max 50)
 */
const calculateDevelopmentScore = (githubData, projects = [], activities = []) => {
  if (!githubData && (!projects || projects.length === 0)) {
    return {
      totalScore: 0,
      breakdown: {
        activityScore: 0,
        projectScore: 0,
        breadthScore: 0,
        collaborationScore: 0,
        openSourceScore: 0,
        deliveryScore: 0,
        consistencyScore: 0,
      },
    };
  }

  // Handle both flat legacy githubData and new structured githubData
  const profile = githubData?.profile || githubData || {};
  const repositories = githubData?.repositories || githubData?.repos || [];
  const languages = githubData?.languages || {};
  const commits = githubData?.commits || {};
  const pullRequests = githubData?.pullRequests || {};
  const reviews = githubData?.reviews || {};
  const openSource = githubData?.openSource || {};
  const releases = githubData?.releases || {};
  const consistency = githubData?.activity?.consistencyScore || githubData?.contributions?.dailyStreak || 0;

  // 1. Development Activity (25% → max 250 pts)
  // Uses recent commits and events with diminishing returns:
  // 10 commits -> ~50 pts, 50 commits -> ~150 pts, 100+ commits -> 220-250 pts
  const recentCommits = commits.recentCount30Days || 0;
  const recentEvents = githubData?.contributions?.totalRecentEvents || (activities ? activities.length : 0);
  let activityScore = Math.round(Math.min(Math.sqrt(recentCommits) * 22 + Math.min(recentEvents * 3, 50), 250));
  if (activityScore === 0 && profile.publicRepos > 0) {
    activityScore = Math.min(profile.publicRepos * 10, 80); // baseline for having public repos
  }

  // 2. Project Experience (25% → max 250 pts)
  // Evaluates public repos + submitted portfolio projects + live URLs + descriptions
  const repoCount = repositories.length || profile.publicRepos || 0;
  const projectCount = projects.length || 0;
  let projectScore = 0;
  projectScore += Math.min(repoCount * 12, 100);
  projectScore += Math.min(projectCount * 40, 100);
  projects.forEach((p) => {
    if (p.liveUrl) projectScore += 15;
    if (p.githubUrl) projectScore += 10;
  });
  projectScore = Math.min(projectScore, 250);

  // 3. Technical Breadth (15% → max 150 pts)
  // Evaluates distinct languages used across repositories and portfolio projects
  const langCount = languages.totalDistinct || (languages.primaryLanguages?.length) || (Object.keys(languages.distribution || {}).length) || 0;
  const projectTechs = new Set(projects.flatMap((p) => p.technologies || []));
  const distinctTechCount = Math.max(langCount, projectTechs.size);
  const breadthScore = Math.min(distinctTechCount * 25, 150);

  // 4. Collaboration (15% → max 150 pts)
  // Evaluates merged PRs, PR participation, and review participation
  const prsMerged = pullRequests.merged || 0;
  const prsOpened = pullRequests.opened || 0;
  const reviewsCount = reviews.submitted || 0;
  let collaborationScore = 0;
  collaborationScore += Math.min(prsMerged * 35, 80);
  collaborationScore += Math.min(prsOpened * 15, 40);
  collaborationScore += Math.min(reviewsCount * 15, 30);
  collaborationScore = Math.min(collaborationScore, 150);

  // 5. Open Source (10% → max 100 pts)
  // Evaluates contributions to external repositories/organizations
  const externalRepos = openSource.externalReposContributed || 0;
  const externalPRs = openSource.externalPRs || 0;
  let openSourceScore = 0;
  openSourceScore += Math.min(externalRepos * 35, 60);
  openSourceScore += Math.min(externalPRs * 20, 40);
  openSourceScore = Math.min(openSourceScore, 100);

  // 6. Software Delivery (5% → max 50 pts)
  // Evaluates published releases and deployed live projects
  const releaseCount = releases.count || 0;
  const liveProjectsCount = projects.filter((p) => Boolean(p.liveUrl)).length;
  let deliveryScore = 0;
  deliveryScore += Math.min(releaseCount * 25, 30);
  deliveryScore += Math.min(liveProjectsCount * 15, 20);
  deliveryScore = Math.min(deliveryScore, 50);

  // 7. Consistency (5% → max 50 pts)
  // Evaluates active days and learning/development streak
  const streakDays = githubData?.contributions?.dailyStreak || 0;
  const consistencyScore = Math.min(streakDays * 5 + Math.min(consistency * 0.3, 20), 50);

  const totalScore = Math.min(
    Math.round(activityScore + projectScore + breadthScore + collaborationScore + openSourceScore + deliveryScore + consistencyScore),
    1000
  );

  return {
    totalScore,
    breakdown: {
      activityScore: Math.round(activityScore),
      projectScore: Math.round(projectScore),
      breadthScore: Math.round(breadthScore),
      collaborationScore: Math.round(collaborationScore),
      openSourceScore: Math.round(openSourceScore),
      deliveryScore: Math.round(deliveryScore),
      consistencyScore: Math.round(consistencyScore),
    },
  };
};

/**
 * Calculate Problem Solving score based on LeetCode and Codeforces data.
 * Max score: 1000
 */
const calculateProblemSolvingScore = (leetcodeData, codeforcesData) => {
  let score = 0;

  if (leetcodeData) {
    let lcPoints = 0;
    lcPoints += (leetcodeData.solvedEasy || 0) * 1.5;
    lcPoints += (leetcodeData.solvedMedium || 0) * 3.5;
    lcPoints += (leetcodeData.solvedHard || 0) * 6;
    if (lcPoints === 0 && leetcodeData.solved) {
      lcPoints = leetcodeData.solved * 3;
    }
    score += Math.min(lcPoints, 600);
  }

  if (codeforcesData && codeforcesData.rating) {
    score += Math.min(Math.floor(codeforcesData.rating * 0.45), 400);
  }

  return Math.min(Math.round(score), 1000);
};

/**
 * Calculate Knowledge / Community score based on Stack Overflow & verified skills.
 * Max score: 1000
 */
const calculateKnowledgeScore = (stackOverflowData, skillsList = []) => {
  let score = 0;

  if (stackOverflowData) {
    score += Math.min(Math.floor((stackOverflowData.reputation || 0) * 0.25), 400);
    score += Math.min((stackOverflowData.goldBadges || 0) * 40, 200);
    score += Math.min((stackOverflowData.silverBadges || 0) * 20, 200);
  }

  if (skillsList && skillsList.length > 0) {
    score += Math.min(skillsList.length * 15, 200);
  }

  return Math.min(Math.round(score), 1000);
};

/**
 * Calculate unified Overall Score (0-1000) for a student across all vectors.
 */
const calculateUnifiedOverallScore = (user, projects = [], devScoreObj = null) => {
  const pd = user.platformData || {};
  const devResult = devScoreObj || calculateDevelopmentScore(pd.github, projects);
  const devScore = devResult.totalScore || 0;
  const psScore = calculateProblemSolvingScore(pd.leetcode, pd.codeforces);
  const commScore = calculateKnowledgeScore(pd.stackoverflow, user.skillsList);

  // Academic score (max 150)
  let academicScore = 0;
  if (user.cgpa) {
    academicScore = Math.min(user.cgpa * 15, 150);
  } else if (user.degree || user.university?.name) {
    academicScore = 80;
  }

  // Profile completion (max 100)
  const profileCompPoints = Math.min((user.profileCompletion || 0) * 1.0, 100);

  // Resume presence (100)
  const hasResume = user.portfolioDocs?.some((doc) => doc.category === 'Resume');
  const resumePoints = hasResume ? 100 : 0;

  // Submitted portfolio projects (max 100)
  const projectPoints = Math.min(projects.length * 20, 100);

  // Certifications (max 50)
  const certPoints = Math.min((user.certificates?.length || 0) * 10, 50);

  // Verified Platform Presence (max 150 -> 50 each for GitHub, LeetCode, Codeforces)
  let platformLinkPoints = 0;
  if (user.platforms?.github?.username || user.githubUsername) platformLinkPoints += 50;
  if (user.platforms?.leetcode?.username) platformLinkPoints += 50;
  if (user.platforms?.codeforces?.username) platformLinkPoints += 50;

  // Practical Experience: Internship (100), Hackathon (100), Research Paper (50)
  const hasInternship = user.portfolioDocs?.some((doc) => doc.category === 'Internship');
  const internshipPoints = hasInternship ? 100 : 0;

  const hasHackathon = user.achievements?.some((a) => a.category === 'Hackathon') || user.portfolioDocs?.some((d) => d.category === 'Achievement');
  const hackathonPoints = hasHackathon ? 100 : 0;

  const hasResearchPaper = user.portfolioDocs?.some((doc) => doc.category === 'Research Paper');
  const researchPaperPoints = hasResearchPaper ? 50 : 0;

  // Skills (max 100)
  const skillPoints = Math.min((user.skillsList?.length || 0) * 10, 100);

  const rawOverall = academicScore + profileCompPoints + resumePoints + projectPoints + certPoints + platformLinkPoints + internshipPoints + hackathonPoints + researchPaperPoints + skillPoints;
  const overallScore = Math.min(Math.round(rawOverall), 1000);

  return {
    overall: overallScore,
    development: devScore,
    problemSolving: psScore,
    community: commScore,
    developmentBreakdown: devResult.breakdown,
  };
};

module.exports = {
  calculateDevelopmentScore,
  calculateProblemSolvingScore,
  calculateKnowledgeScore,
  calculateUnifiedOverallScore,
};
