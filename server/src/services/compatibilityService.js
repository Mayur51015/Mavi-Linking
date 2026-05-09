const User = require('../models/User');
const DNA = require('../models/DNA');
const Insight = require('../models/Insight');
const Compatibility = require('../models/Compatibility');

/**
 * Compare two or more developers and generate a compatibility report.
 */
const compareUsers = async (userIds) => {
  if (!Array.isArray(userIds) || userIds.length < 2) {
    throw new Error('At least two user IDs are required for comparison.');
  }

  // Fetch all users with their data
  const users = await User.find({ _id: { $in: userIds } }).select('-password -__v');
  if (users.length < 2) {
    throw new Error('Could not find all specified users.');
  }

  // Fetch DNA and Insights for each user
  const [dnas, insights] = await Promise.all([
    DNA.find({ userId: { $in: userIds } }),
    Insight.find({ userId: { $in: userIds } }),
  ]);

  const dnaMap = Object.fromEntries(dnas.map(d => [d.userId.toString(), d]));
  const insightMap = Object.fromEntries(insights.map(i => [i.userId.toString(), i]));

  // Calculate compatibility dimensions
  const breakdown = calculateBreakdown(users, dnaMap, insightMap);
  const overallScore = Math.round(
    (breakdown.skillComplementarity +
      breakdown.workStyleMatch +
      breakdown.codingBehavior +
      breakdown.contributionBalance +
      breakdown.personalityFit) / 5
  );

  const complementaryStrengths = findComplementaryStrengths(users, insightMap);
  const recommendedRoles = assignRoles(users, insightMap, dnaMap);

  const compatibility = await Compatibility.findOneAndUpdate(
    { userIds: { $all: userIds, $size: userIds.length } },
    {
      userIds,
      overallScore,
      breakdown,
      complementaryStrengths,
      recommendedRoles,
      aiSummary: generateSummary(users, overallScore, breakdown),
      generatedAt: new Date(),
    },
    { new: true, upsert: true }
  );

  return {
    compatibility,
    users: users.map(u => ({
      id: u._id,
      name: u.name,
      avatar: u.avatar,
      username: u.username || u.platforms?.github?.username,
      scores: u.scores,
    })),
  };
};

function calculateBreakdown(users, dnaMap, insightMap) {
  const scores = users.map(u => u.scores || {});
  const dnas = users.map(u => dnaMap[u._id.toString()]);

  // Skill complementarity — higher if users have different strength areas
  const scoreKeys = ['development', 'problemSolving', 'knowledge'];
  let complementarity = 0;
  for (const key of scoreKeys) {
    const vals = scores.map(s => s[key] || 0);
    const range = Math.max(...vals) - Math.min(...vals);
    complementarity += range > 200 ? 80 : range > 100 ? 60 : 40;
  }
  complementarity = Math.min(Math.round(complementarity / scoreKeys.length), 100);

  // Work style match
  const workStyles = dnas.filter(Boolean).map(d => d.workingStyle);
  const workStyleMatch = workStyles.length >= 2
    ? (new Set(workStyles).size === 1 ? 90 : workStyles.includes('Hybrid') ? 70 : 50)
    : 50;

  // Coding behavior — based on overall score similarity
  const overalls = scores.map(s => s.overall || 0);
  const overallDiff = Math.abs(Math.max(...overalls) - Math.min(...overalls));
  const codingBehavior = overallDiff < 100 ? 90 : overallDiff < 300 ? 70 : 50;

  // Contribution balance
  const totalScore = overalls.reduce((a, b) => a + b, 0);
  const avgScore = totalScore / overalls.length;
  const deviations = overalls.map(o => Math.abs(o - avgScore));
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  const contributionBalance = avgDeviation < 50 ? 95 : avgDeviation < 150 ? 70 : 45;

  // Personality fit
  const dnaScores = dnas.filter(Boolean).map(d => d.scores || {});
  let personalityFit = 60;
  if (dnaScores.length >= 2) {
    const collabs = dnaScores.map(s => s.collaboration || 50);
    const avgCollab = collabs.reduce((a, b) => a + b, 0) / collabs.length;
    personalityFit = avgCollab > 70 ? 85 : avgCollab > 50 ? 65 : 45;
  }

  return {
    skillComplementarity: complementarity,
    workStyleMatch,
    codingBehavior,
    contributionBalance,
    personalityFit,
  };
}

function findComplementaryStrengths(users, insightMap) {
  const allSkills = new Map();
  for (const user of users) {
    const insight = insightMap[user._id.toString()];
    if (insight?.topSkills) {
      for (const skill of insight.topSkills) {
        if (!allSkills.has(skill)) allSkills.set(skill, []);
        allSkills.get(skill).push(user.name);
      }
    }
  }

  // Find skills that are unique to individual members (complementary)
  const complementary = [];
  for (const [skill, owners] of allSkills) {
    if (owners.length === 1) {
      complementary.push(`${owners[0]} brings ${skill}`);
    }
  }
  return complementary.slice(0, 6);
}

function assignRoles(users, insightMap, dnaMap) {
  const roles = {};
  for (const user of users) {
    const insight = insightMap[user._id.toString()];
    const dna = dnaMap[user._id.toString()];
    const uid = user._id.toString();

    if (dna?.personalityType === 'Scale Architect' || dna?.personalityType === 'Startup Engineer') {
      roles[uid] = 'Tech Lead';
    } else if (insight?.specialization?.toLowerCase().includes('full stack')) {
      roles[uid] = 'Full Stack Developer';
    } else if (insight?.specialization?.toLowerCase().includes('frontend')) {
      roles[uid] = 'Frontend Developer';
    } else if (insight?.specialization?.toLowerCase().includes('backend')) {
      roles[uid] = 'Backend Developer';
    } else if (dna?.personalityType === 'Problem Solver') {
      roles[uid] = 'Algorithm Specialist';
    } else {
      roles[uid] = 'Developer';
    }
  }
  return roles;
}

function generateSummary(users, overallScore, breakdown) {
  const names = users.map(u => u.name).join(', ');
  const quality = overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Moderate';
  return `${quality} team compatibility (${overallScore}%) between ${names}. ` +
    `Strongest dimension: ${getStrongestDimension(breakdown)}. ` +
    `This team would work well for collaborative projects.`;
}

function getStrongestDimension(breakdown) {
  const entries = Object.entries(breakdown);
  entries.sort((a, b) => b[1] - a[1]);
  const labels = {
    skillComplementarity: 'Skill Complementarity',
    workStyleMatch: 'Work Style Match',
    codingBehavior: 'Coding Behavior',
    contributionBalance: 'Contribution Balance',
    personalityFit: 'Personality Fit',
  };
  return labels[entries[0][0]] || entries[0][0];
}

module.exports = {
  compareUsers,
};
