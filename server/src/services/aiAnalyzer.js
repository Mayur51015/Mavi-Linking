const { OpenAI } = require('openai');
const Insight = require('../models/Insight');
const DNA = require('../models/DNA');
const Ranking = require('../models/Ranking');
const Analytics = require('../models/Analytics');
const Project = require('../models/Project');

/**
 * Build a rich developer profile summary for AI analysis.
 */
const buildProfileSummary = (user, projects = []) => {
  const pd = user.platformData || {};
  const summary = {
    name: user.name,
    scores: user.scores,
    skills: user.skillsList ? user.skillsList.map(s => s.name) : [],
    preferredDomain: user.preferredDomain || null,
    projects: projects.map(p => ({
      title: p.title,
      description: p.description,
      technologies: p.technologies,
      githubUrl: p.githubUrl,
    })),
    github: null,
    leetcode: null,
    codeforces: null,
    stackoverflow: null,
  };

  if (pd.github) {
    summary.github = {
      publicRepos: pd.github.publicRepos,
      followers: pd.github.followers,
      following: pd.github.following,
      bio: pd.github.bio,
      company: pd.github.company,
      location: pd.github.location,
      accountAge: pd.github.createdAt
        ? `${Math.round((Date.now() - new Date(pd.github.createdAt)) / (365.25 * 86400000))} years`
        : null,
      repos: pd.github.repos || [],
    };
  }

  if (pd.leetcode) {
    summary.leetcode = {
      solved: pd.leetcode.solved,
      easy: pd.leetcode.solvedEasy,
      medium: pd.leetcode.solvedMedium,
      hard: pd.leetcode.solvedHard,
      ranking: pd.leetcode.ranking,
    };
  }

  if (pd.codeforces) {
    summary.codeforces = {
      rating: pd.codeforces.rating,
      maxRating: pd.codeforces.maxRating,
      rank: pd.codeforces.rank,
      maxRank: pd.codeforces.maxRank,
      contribution: pd.codeforces.contribution,
    };
  }

  if (pd.stackoverflow) {
    summary.stackoverflow = {
      reputation: pd.stackoverflow.reputation,
      goldBadges: pd.stackoverflow.goldBadges,
      silverBadges: pd.stackoverflow.silverBadges,
      bronzeBadges: pd.stackoverflow.bronzeBadges,
      answerCount: pd.stackoverflow.answerCount,
      questionCount: pd.stackoverflow.questionCount,
    };
  }

  return summary;
};

const analyzeUser = async (user) => {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;
  const grokApiKey = process.env.GROK_API_KEY;
  const openaiApiKey = process.env.OPENAI_INSIGHTS_API_KEY || process.env.OPENAI_API_KEY;

  const apiKey = geminiApiKey || groqApiKey || grokApiKey || openaiApiKey;

  // Retrieve actual student projects from database
  const projects = await Project.find({ user: user._id });

  let result;

  if (!apiKey) {
    // Generate clean mock result based on user details and actual projects
    const topSkills = user.skillsList && user.skillsList.length > 0
      ? user.skillsList.map(s => s.name)
      : (projects.length > 0 ? Array.from(new Set(projects.flatMap(p => p.technologies))) : ["JavaScript", "Node.js", "React", "MongoDB", "Express"]);
      
    const confidenceScores = {};
    topSkills.forEach(skill => {
      confidenceScores[skill] = Math.floor(Math.random() * 21) + 75; // 75-95
    });

    result = {
      insight: {
        specialization: user.preferredDomain || "Full Stack Developer",
        topSkills,
        techStack: topSkills,
        confidenceScores,
        strengths: [
          "Strong candidate with solid academic performance",
          "Shows dedication to full-stack project building",
          "Consistent developer profile layout"
        ],
        improvements: [
          "Can expand cloud deployment capabilities",
          "Should focus more on automated tests frameworks"
        ],
        careerRecommendations: [
          "Associate Software Engineer",
          "Full Stack Developer"
        ]
      },
      dna: {
        personalityType: "Project Builder",
        workingStyle: "Collaborative",
        scores: {
          collaboration: 85,
          innovation: 80,
          learningAdaptability: 88,
          consistency: 75
        },
        extendedScores: {
          engineeringMaturity: Math.min(70 + projects.length * 5, 100),
          problemSolvingDepth: user.platformData?.leetcode?.solved ? Math.min(50 + Math.round(user.platformData.leetcode.solved / 5), 100) : 65,
          systemDesign: Math.min(60 + projects.length * 6, 100),
          codeQuality: 75,
          technicalDiversity: 70
        },
        description: `${user.name} is a goal-oriented individual specializing in developer intelligence modules and placement metrics.`,
        strengths: ["Clean component layout design", "API integration skills"],
        weaknesses: ["Deep systems engineering expertise"]
      },
      analytics: {
        aiSummary: "The developer demonstrates reliable engineering foundations and strong self-guided project ownership.",
        growthPrediction: "Expected to specialize further in full-stack engineering over the next 12 months.",
        careerInsight: "Best fits in software engineering roles within collaborative agile engineering environments."
      }
    };
  } else {
    const baseURL = geminiApiKey ? 'https://generativelanguage.googleapis.com/v1beta/openai/'
                  : groqApiKey ? 'https://api.groq.com/openai/v1' 
                  : grokApiKey ? 'https://api.x.ai/v1' 
                  : undefined;

    const openai = new OpenAI({ apiKey, baseURL });
    
    const modelName = geminiApiKey ? 'gemini-2.5-flash'
                    : groqApiKey ? 'llama-3.1-8b-instant' 
                    : grokApiKey ? 'grok-2-latest' 
                    : 'gpt-4o-mini';
    
    // Build enriched profile summary
    const profileSummary = JSON.stringify(buildProfileSummary(user, projects));

    const prompt = `You are an expert AI Developer Intelligence System. Analyze the developer data and provide a comprehensive JSON profile with deep technical insights.

The developer data: ${profileSummary}

Analyze deeply:
- Repository patterns and project complexity
- Problem-solving depth (LeetCode/Codeforces difficulty distribution)
- Engineering maturity based on account age and activity
- Technical diversity across platforms
- Collaboration indicators (followers, contributions, answers)
- Open source influence
- Consistency patterns

Format exactly as valid JSON:
{
  "insight": {
    "specialization": "Frontend Developer | Backend Developer | Full Stack Developer | AI/ML Engineer | DevOps Engineer | etc.",
    "topSkills": ["React", "Node.js", "MongoDB", "Python", "etc."],
    "techStack": ["JavaScript", "React", "Express", "MongoDB", "etc."],
    "confidenceScores": {"React": 90, "Node.js": 85, "MongoDB": 80},
    "strengths": ["Strong problem-solving with X hard problems solved", "Active open-source contributor", "..."],
    "improvements": ["Could improve system design skills", "Should explore cloud technologies", "..."],
    "careerRecommendations": ["Senior Full Stack Developer at a startup", "..."]
  },
  "dna": {
    "personalityType": "Problem Solver | Project Builder | Open Source Contributor | Startup Engineer | Scale Architect | Research Engineer | Product Builder | Performance Optimizer | Full Stack Generalist | DevOps Engineer | AI/ML Specialist",
    "workingStyle": "Independent | Collaborative | Hybrid | Mentorship-Driven | Sprint-Based",
    "scores": {"collaboration": 80, "innovation": 90, "learningAdaptability": 85, "consistency": 70},
    "extendedScores": {"engineeringMaturity": 75, "problemSolvingDepth": 80, "systemDesign": 60, "codeQuality": 70, "technicalDiversity": 65},
    "description": "A detailed 2-3 sentence personality description...",
    "strengths": ["Excellent at building full-stack applications", "..."],
    "weaknesses": ["Limited experience with cloud infrastructure", "..."]
  },
  "analytics": {
    "aiSummary": "A comprehensive 2-3 sentence growth summary and prediction...",
    "growthPrediction": "Based on current trajectory, this developer is likely to...",
    "careerInsight": "This developer would thrive as..."
  }
}`;

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: 'You are an AI Developer Intelligence System that analyzes developer profiles across GitHub, LeetCode, Codeforces, and StackOverflow to generate deep technical insights, personality profiles, and career recommendations.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    result = JSON.parse(response.choices[0].message.content);
  }

  // Calculate dynamic ranking score based on user.scores + some variance
  const rawScore = (user.scores?.overall || 0);
  let tier = 'Bronze';
  if (rawScore > 900) tier = 'Elite Developer';
  else if (rawScore > 750) tier = 'Diamond';
  else if (rawScore > 600) tier = 'Platinum';
  else if (rawScore > 450) tier = 'Gold';
  else if (rawScore > 250) tier = 'Silver';

  // Fetch previous DNA for evolution tracking
  const previousDna = await DNA.findOne({ userId: user._id });
  const evolutionEntry = previousDna ? {
    date: new Date(),
    personalityType: previousDna.personalityType,
    scores: previousDna.scores ? { ...previousDna.scores.toObject?.() || previousDna.scores } : null,
    trigger: 'analysis',
  } : null;

  // Save to DB
  const insight = await Insight.findOneAndUpdate(
    { userId: user._id },
    { ...result.insight, userId: user._id, lastUpdated: new Date() },
    { new: true, upsert: true }
  );

  const dnaUpdate = {
    ...result.dna,
    userId: user._id,
    lastUpdated: new Date(),
  };
  // Append to evolution timeline
  if (evolutionEntry) {
    dnaUpdate.$push = { evolution: evolutionEntry };
  }

  let dna;
  if (evolutionEntry) {
    dna = await DNA.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          personalityType: result.dna.personalityType,
          workingStyle: result.dna.workingStyle,
          scores: result.dna.scores,
          extendedScores: result.dna.extendedScores || {},
          description: result.dna.description,
          strengths: result.dna.strengths || [],
          weaknesses: result.dna.weaknesses || [],
          userId: user._id,
          lastUpdated: new Date(),
        },
        $push: { evolution: evolutionEntry },
      },
      { new: true, upsert: true }
    );
  } else {
    dna = await DNA.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          personalityType: result.dna.personalityType,
          workingStyle: result.dna.workingStyle,
          scores: result.dna.scores,
          extendedScores: result.dna.extendedScores || {},
          description: result.dna.description,
          strengths: result.dna.strengths || [],
          weaknesses: result.dna.weaknesses || [],
          userId: user._id,
          lastUpdated: new Date(),
        },
      },
      { new: true, upsert: true }
    );
  }

  // Fetch previous ranking for history
  const previousRanking = await Ranking.findOne({ userId: user._id });
  const rankingHistoryEntry = previousRanking ? {
    date: new Date(),
    score: previousRanking.score,
    globalRank: previousRanking.globalRank,
    tier: previousRanking.tier,
  } : null;

  const rankingUpdate = {
    $set: {
      score: rawScore,
      tier,
      userId: user._id,
      lastUpdated: new Date(),
      categoryRanks: {
        codeQuality: result.dna?.extendedScores?.codeQuality || 0,
        projectComplexity: result.dna?.extendedScores?.engineeringMaturity || 0,
        openSourceInfluence: Math.min((user.platformData?.github?.followers || 0) * 2, 100),
        consistencyScore: result.dna?.scores?.consistency || 0,
        technicalDiversity: result.dna?.extendedScores?.technicalDiversity || 0,
        collaborationImpact: result.dna?.scores?.collaboration || 0,
      },
    },
  };
  if (rankingHistoryEntry) {
    rankingUpdate.$push = { history: { $each: [rankingHistoryEntry], $slice: -50 } };
  }

  const ranking = await Ranking.findOneAndUpdate(
    { userId: user._id },
    rankingUpdate,
    { new: true, upsert: true }
  );

  const month = new Date().toISOString().slice(0, 7);
  const analytics = await Analytics.findOneAndUpdate(
    { userId: user._id, month },
    {
      aiSummary: result.analytics.aiSummary,
      userId: user._id,
      month,
    },
    { new: true, upsert: true }
  );

  return { insight, dna, ranking, analytics };
};

module.exports = {
  analyzeUser
};
