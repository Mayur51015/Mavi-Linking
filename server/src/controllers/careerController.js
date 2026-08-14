const CareerScore = require('../models/CareerScore');
const CareerTimeline = require('../models/CareerTimeline');
const Activity = require('../models/Activity');
const CareerBadge = require('../models/CareerBadge');
const CareerInsight = require('../models/CareerInsight');
const User = require('../models/User');
const DNA = require('../models/DNA');
const Project = require('../models/Project');
const Insight = require('../models/Insight');
const CareerAnalytics = require('../models/CareerAnalytics');
const CareerSkillAnalysis = require('../models/CareerSkillAnalysis');
const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');

// Helper to resolve target user ID
const getTargetUserId = (req) => {
  let target = req.user.id;
  if (req.query.userId && req.user.role !== 'user') {
    target = req.query.userId;
  }
  return target;
};

/**
 * @desc    Get complete Career Intelligence Dashboard data (score, timeline, badges, insights)
 * @route   GET /api/career/dashboard
 * @access  Private
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const targetUserId = getTargetUserId(req);
    
    const user = await User.findById(targetUserId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Fetch details in parallel
    const [score, timeline, badges, insight] = await Promise.all([
      CareerScore.findOne({ user: targetUserId }),
      CareerTimeline.find({ user: targetUserId }).sort({ timestamp: -1 }),
      CareerBadge.find({ user: targetUserId }).sort({ awardedAt: -1 }),
      CareerInsight.findOne({ user: targetUserId })
    ]);

    res.status(200).json({
      success: true,
      data: {
        user: {
          name: user.name,
          avatar: user.avatar,
          profileCompletion: user.profileCompletion,
          degree: user.degree,
          cgpa: user.cgpa,
          university: user.university
        },
        score: score || { overall: 0, development: 0, problemSolving: 0, community: 0 },
        timeline: timeline || [],
        badges: badges || [],
        insight: insight || { strengths: [], improvements: [], recommendedRoles: [], hiringRecommendation: 'Needs Mentoring' }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user scores
 * @route   GET /api/career/score
 * @access  Private
 */
exports.getScore = async (req, res, next) => {
  try {
    const targetUserId = getTargetUserId(req);
    const score = await CareerScore.findOne({ user: targetUserId });
    
    res.status(200).json({
      success: true,
      data: score || { overall: 0, development: 0, problemSolving: 0, community: 0 }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get timeline events
 * @route   GET /api/career/timeline
 * @access  Private
 */
exports.getTimeline = async (req, res, next) => {
  try {
    const targetUserId = getTargetUserId(req);

    const [careerEvents, activities] = await Promise.all([
      CareerTimeline.find({ user: targetUserId })
        .sort({ timestamp: -1 })
        .limit(100)
        .lean(),
      Activity.find({ userId: targetUserId })
        .sort({ date: -1 })
        .limit(100)
        .lean()
    ]);

    const timeline = [
      ...careerEvents.map((event) => ({
        _id: event._id,
        type: event.type,
        title: event.title,
        description: event.description,
        timestamp: event.timestamp,
        url: event.url || null,
        source: 'career'
      })),
      ...activities.map((activity) => ({
        _id: activity._id,
        type:
          activity.platform === 'github'
            ? 'GITHUB'
            : activity.platform === 'leetcode'
              ? 'LEETCODE'
              : activity.type?.toUpperCase() || 'ACTIVITY',
        title: activity.title,
        description: activity.description,
        timestamp: activity.date,
        url: activity.url || null,
        source: activity.platform || 'system'
      }))
    ]
      .filter((event) => event.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      data: timeline
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get badges
 * @route   GET /api/career/badges
 * @access  Private
 */
exports.getBadges = async (req, res, next) => {
  try {
    const targetUserId = getTargetUserId(req);
    const badges = await CareerBadge.find({ user: targetUserId }).sort({ awardedAt: -1 });
    
    res.status(200).json({
      success: true,
      data: badges
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get AI insights
 * @route   GET /api/career/insights
 * @access  Private
 */
exports.getInsights = async (req, res, next) => {
  try {
    const targetUserId = getTargetUserId(req);
    const [careerInsight, legacyInsight] = await Promise.all([
      CareerInsight.findOne({ user: targetUserId }),
      Insight.findOne({ userId: targetUserId })
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        specialization: legacyInsight?.specialization || 'Software Engineer',
        techStack: legacyInsight?.techStack || [],
        confidenceScores: legacyInsight?.confidenceScores ? (legacyInsight.confidenceScores.toObject?.() || legacyInsight.confidenceScores) : {},
        strengths: careerInsight?.strengths || legacyInsight?.strengths || [],
        improvements: careerInsight?.improvements || legacyInsight?.improvements || [],
        recommendedRoles: careerInsight?.recommendedRoles || legacyInsight?.careerRecommendations || [],
        hiringRecommendation: careerInsight?.hiringRecommendation || 'Needs Mentoring',
        lastUpdated: careerInsight?.lastUpdated || legacyInsight?.lastUpdated
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Trigger recalculation of scores and parameters
 * @route   POST /api/career/recalculate
 * @access  Private
 */
exports.recalculate = async (req, res, next) => {
  try {
    const targetUserId = getTargetUserId(req);
    const user = await evaluateUserIntelligence(targetUserId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.status(200).json({
      success: true,
      message: 'Dashboard and intelligence scores successfully updated.',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Developer DNA profile
 * @route   GET /api/career/dna
 * @access  Private
 */
exports.getDNA = async (req, res, next) => {
  try {
    const targetUserId = getTargetUserId(req);
    
    let dna = await DNA.findOne({ userId: targetUserId });
    
    // Fallback trigger if no DNA exists yet
    if (!dna) {
      const user = await User.findById(targetUserId);
      if (user) {
        try {
          const aiAnalyzer = require('../services/aiAnalyzer');
          const result = await aiAnalyzer.analyzeUser(user);
          dna = result.dna;
        } catch (err) {
          console.warn('AI DNA generation error:', err.message);
        }
      }
    }

    if (!dna) {
      return res.status(200).json({ success: true, data: null });
    }

    const projects = await Project.find({ user: targetUserId });
    const userObj = await User.findById(targetUserId);

    // Calculate dynamic frontend / backend / problemSolving / leadership / communication scores
    const skills = (userObj?.skillsList || []).map(s => s.name.toLowerCase().trim());
    const projectTechs = projects.flatMap(p => p.technologies || []).map(t => t.toLowerCase().trim());
    const allTechs = new Set([...skills, ...projectTechs]);

    const isBackend = Array.from(allTechs).some(t => ['node', 'node.js', 'express', 'mongodb', 'sql', 'postgres', 'python', 'django', 'java', 'spring', 'go'].includes(t));
    const isFrontend = Array.from(allTechs).some(t => ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript', 'tailwind'].includes(t));
    
    const backendScore = isBackend ? 85 : 60;
    const frontendScore = isFrontend ? 80 : 55;

    let problemSolvingScore = dna.extendedScores?.problemSolvingDepth || 65;
    if (userObj?.platformData?.leetcode?.solved) {
      problemSolvingScore = Math.min(65 + Math.round(userObj.platformData.leetcode.solved / 3), 98);
    }

    const isAdvanced = userObj?.experienceLevel === 'Advanced';
    const leadershipScore = isAdvanced ? 85 : 65;

    const completion = userObj?.profileCompletion || 50;
    const communicationScore = Math.min(65 + Math.round(completion / 3), 95);

    res.status(200).json({
      success: true,
      data: {
        personalityType: dna.personalityType,
        workingStyle: dna.workingStyle,
        description: dna.description,
        collaboration: dna.scores?.collaboration || 50,
        innovation: dna.scores?.innovation || 50,
        focus: dna.scores?.consistency || dna.scores?.learningAdaptability || 50,
        engineeringMaturity: dna.extendedScores?.engineeringMaturity || 50,
        systemDesign: dna.extendedScores?.systemDesign || 50,
        backend: backendScore,
        frontend: frontendScore,
        problemSolving: problemSolvingScore,
        leadership: leadershipScore,
        communication: communicationScore,
        evolution: dna.evolution || []
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user detected skills
 * @route   GET /api/career/skills
 * @access  Private
 */
exports.getSkills = async (req, res, next) => {
  try {
    const targetUserId = getTargetUserId(req);
    let insight = await Insight.findOne({ userId: targetUserId });
    
    if (!insight) {
      const user = await User.findById(targetUserId);
      if (user) {
        try {
          const aiAnalyzer = require('../services/aiAnalyzer');
          const result = await aiAnalyzer.analyzeUser(user);
          insight = result.insight;
        } catch (err) {
          console.warn('AI Insights generation error:', err.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: insight || { specialization: 'Software Engineer', techStack: [], confidenceScores: {} }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get chronological analytics snapshots
 * @route   GET /api/career/analytics
 * @access  Private
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    const targetUserId = getTargetUserId(req);
    const analytics = await CareerAnalytics.find({ user: targetUserId }).sort({ month: 1 });
    
    res.status(200).json({
      success: true,
      data: analytics || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user skill analysis
 * @route   GET /api/career/analysis
 * @access  Private
 */
exports.getAnalysis = async (req, res, next) => {
  try {
    const targetUserId = getTargetUserId(req);
    let analysis = await CareerSkillAnalysis.findOne({ userId: targetUserId });
    
    // Automatically generate if it does not exist yet
    if (!analysis) {
      const user = await User.findById(targetUserId);
      if (user) {
        try {
          const aiAnalyzer = require('../services/aiAnalyzer');
          const projects = await Project.find({ userId: targetUserId });
          const result = await aiAnalyzer.analyzeUser(user, projects);
          analysis = await CareerSkillAnalysis.findOne({ userId: targetUserId });
        } catch (err) {
          console.warn('Auto AI analysis generation error:', err.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: analysis || { specialization: 'Software Developer', topSkills: [], confidence: 85, radar: [] }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Trigger AI analysis
 * @route   POST /api/career/analyze
 * @access  Private
 */
exports.analyze = async (req, res, next) => {
  try {
    const targetUserId = getTargetUserId(req);
    const user = await evaluateUserIntelligence(targetUserId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const analysis = await CareerSkillAnalysis.findOne({ userId: targetUserId });
    
    res.status(200).json({
      success: true,
      message: 'AI career and skill analysis completed successfully.',
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

// Legacy alias mapping for older frontend calls
exports.syncProfiles = exports.recalculate;
