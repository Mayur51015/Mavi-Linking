/**
 * Calculate the Development score based on GitHub data.
 * Max score: 1000
 */
const calculateDevelopmentScore = (githubData) => {
  if (!githubData) return 0;
  
  let score = 0;
  
  // Public repos: 10 points each (max 400)
  score += Math.min(githubData.publicRepos * 10, 400);
  
  // Followers: 5 points each (max 400)
  score += Math.min(githubData.followers * 5, 400);
  
  // Base bonus for having a linked account with bio or company (max 200)
  if (githubData.bio) score += 100;
  if (githubData.company) score += 100;

  return Math.min(score, 1000);
};

/**
 * Calculate the Problem Solving score based on LeetCode and Codeforces data.
 * Max score: 1000
 */
const calculateProblemSolvingScore = (leetcodeData, codeforcesData) => {
  let score = 0;

  // LeetCode (max 600)
  if (leetcodeData) {
    let lcScore = 0;
    lcScore += (leetcodeData.solvedEasy || 0) * 1;
    lcScore += (leetcodeData.solvedMedium || 0) * 3;
    lcScore += (leetcodeData.solvedHard || 0) * 5;
    score += Math.min(lcScore, 600);
  }

  // Codeforces (max 400)
  if (codeforcesData && codeforcesData.rating) {
    // Rating / 5 (e.g., 1500 rating -> 300 points)
    let cfScore = Math.floor(codeforcesData.rating / 5);
    score += Math.min(cfScore, 400);
  }

  return Math.min(score, 1000);
};

/**
 * Calculate the Knowledge score based on Stack Overflow data.
 * Max score: 1000
 */
const calculateKnowledgeScore = (stackOverflowData) => {
  if (!stackOverflowData) return 0;

  let score = 0;

  // Reputation: 1 point per 10 reputation (max 600)
  score += Math.min(Math.floor((stackOverflowData.reputation || 0) / 10), 600);

  // Badges (max 400)
  score += Math.min((stackOverflowData.goldBadges || 0) * 20, 200);
  score += Math.min((stackOverflowData.silverBadges || 0) * 10, 100);
  score += Math.min((stackOverflowData.bronzeBadges || 0) * 5, 100);

  return Math.min(score, 1000);
};

/**
 * Calculate the Overall score and component scores from raw platform data.
 * @param {Object} platformData - The cached platformData from User model
 */
const calculateAggregatedScores = (platformData) => {
  if (!platformData) {
    return { development: 0, problemSolving: 0, knowledge: 0, overall: 0 };
  }

  const development = calculateDevelopmentScore(platformData.github);
  const problemSolving = calculateProblemSolvingScore(platformData.leetcode, platformData.codeforces);
  const knowledge = calculateKnowledgeScore(platformData.stackoverflow);

  // Count how many categories have a score > 0 to calculate a fair average
  let activeCategories = 0;
  if (development > 0) activeCategories++;
  if (problemSolving > 0) activeCategories++;
  if (knowledge > 0) activeCategories++;

  let overall = 0;
  if (activeCategories > 0) {
    overall = Math.floor((development + problemSolving + knowledge) / 3); 
    // We divide by 3 to normalize the maximum overall score to 1000, 
    // but if you prefer true average of active, divide by activeCategories.
    // Let's divide by 3 so the max possible is 1000 and rewards multiple platforms.
  }

  return {
    development,
    problemSolving,
    knowledge,
    overall
  };
};

module.exports = {
  calculateAggregatedScores,
  calculateDevelopmentScore,
  calculateProblemSolvingScore,
  calculateKnowledgeScore
};
