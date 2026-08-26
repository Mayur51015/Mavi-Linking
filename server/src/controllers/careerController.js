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
const { syncGitHubActivities } = require('../services/githubActivityService');

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
    let score = await CareerScore.findOne({ user: targetUserId });

    // If no score exists or all fields are zero, calculate it on the fly
    if (!score || (score.overall === 0 && score.development === 0 && score.problemSolving === 0 && score.community === 0)) {
      const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');
      await evaluateUserIntelligence(targetUserId);
      score = await CareerScore.findOne({ user: targetUserId });
    }

    const overallScore = score?.overall || 0;
    let rank = null;
    let totalUsers = 0;

    const { PRIVILEGED_ROLES, calculateScoreTier, calculateMedal } = require('../utils/leaderboardHelper');
    
    let medal = null;
    const scoreTier = calculateScoreTier(overallScore);

    if (overallScore > 0) {
      const allEligibleUsers = await User.find({
        role: { $nin: PRIVILEGED_ROLES },
        status: { $ne: 'suspended' },
        'scores.overall': { $gt: 0 }
      })
      .select('maviId scores')
      .sort({
        'scores.overall': -1,
        'scores.problemSolving': -1,
        'scores.development': -1,
        'maviId': 1,
        '_id': 1
      });

      totalUsers = allEligibleUsers.length;
      const userIndex = allEligibleUsers.findIndex(u => u._id.toString() === targetUserId.toString());
      if (userIndex !== -1) {
        rank = userIndex + 1;
        medal = calculateMedal(rank);
      }
    }

    const scoreData = score ? (score.toObject ? score.toObject() : { ...score }) : { overall: 0, development: 0, problemSolving: 0, community: 0 };
    scoreData.rank = rank;
    scoreData.medal = medal;
    scoreData.scoreTier = scoreTier;
    scoreData.totalUsers = totalUsers;

    res.status(200).json({
      success: true,
      data: scoreData
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

    const {
      type = 'all',
      range = 'all',
      page = 1,
      limit = 20
    } = req.query;

    // Sync latest GitHub activity without breaking the timeline
    // when GitHub is unavailable or rate-limited.
    try {
      await syncGitHubActivities(targetUserId);
    } catch (githubError) {
      console.warn('GitHub activity sync failed:', githubError.message);
    }

    const [careerEvents, activities] = await Promise.all([
      CareerTimeline.find({ user: targetUserId }).lean(),
      Activity.find({ userId: targetUserId }).lean()
    ]);

    let timeline = [
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
        type: activity.type?.toUpperCase() || 'ACTIVITY',
        title: activity.title,
        description: activity.description,
        timestamp: activity.date,
        url: activity.url || null,
        repository: activity.url
          ? activity.url.replace('https://github.com/', '')
          : null,
        source: activity.platform || 'system'
      }))
    ];

    if (type !== 'all') {
      const normalizedType = type.toLowerCase();

      timeline = timeline.filter((event) => {
        const eventType = event.type.toLowerCase();

        if (normalizedType === 'commits') return eventType === 'commit';
        if (normalizedType === 'pull_requests') {
          return eventType === 'pull request';
        }
        if (normalizedType === 'issues') return eventType === 'issue';
        if (normalizedType === 'repositories') return eventType === 'repository';
        if (normalizedType === 'releases') return eventType === 'release';

        return true;
      });
    }

    if (range !== 'all') {
      const now = new Date();
      const start = new Date(now);

      if (range === 'today') {
        start.setHours(0, 0, 0, 0);
      } else if (range === 'week') {
        start.setDate(now.getDate() - 7);
      } else if (range === 'month') {
        start.setMonth(now.getMonth() - 1);
      } else if (range === '3months') {
        start.setMonth(now.getMonth() - 3);
      }

      timeline = timeline.filter(
        (event) => new Date(event.timestamp) >= start
      );
    }

    timeline = timeline
      .filter((event) => event.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.min(Math.max(Number(limit), 1), 100);
    const total = timeline.length;
    const startIndex = (pageNumber - 1) * pageSize;

    const paginatedTimeline = timeline.slice(
      startIndex,
      startIndex + pageSize
    );

    res.status(200).json({
      success: true,
      data: paginatedTimeline,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
        hasMore: startIndex + pageSize < total
      }
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

/**
 * @desc    Get student's active MAVI Career Roadmap
 * @route   GET /api/career/roadmap (and /api/student/career-roadmap)
 * @access  Private (Authenticated student)
 */
exports.getRoadmap = async (req, res, next) => {
  try {
    const { getStudentRoadmap } = require('../services/careerRoadmapService');
    const result = await getStudentRoadmap(req.user.id);

    res.status(200).json({
      success: true,
      data: result.roadmap,
      profileStrength: result.profileStrength,
      missingProfileItems: result.missingProfileItems,
      profileChangedSinceGeneration: result.profileChangedSinceGeneration,
    });
  } catch (error) {
    console.error('Error fetching Career Roadmap:', error.message);
    res.status(error.message === 'Student profile not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to retrieve your career roadmap.',
    });
  }
};

/**
 * @desc    Generate or regenerate student's MAVI Career Roadmap
 * @route   POST /api/career/roadmap/generate (and /api/student/career-roadmap/generate)
 * @access  Private (Authenticated student)
 */
exports.generateRoadmap = async (req, res, next) => {
  try {
    const { generateCareerRoadmap, calculateProfileStrength } = require('../services/careerRoadmapService');
    const { targetRole } = req.body || {};

    const roadmap = await generateCareerRoadmap(req.user.id, targetRole);

    res.status(200).json({
      success: true,
      message: 'Your personalized MAVI Career Roadmap has been generated.',
      data: roadmap,
    });
  } catch (error) {
    console.error('Error generating Career Roadmap:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate your career roadmap. Please try again.',
    });
  }
};

/**
 * @desc    Update progress of a milestone item on student roadmap
 * @route   PUT /api/career/roadmap/progress (and /api/student/career-roadmap/progress)
 * @access  Private (Authenticated student)
 */
exports.updateProgress = async (req, res, next) => {
  try {
    const { updateRoadmapProgress } = require('../services/careerRoadmapService');
    const { itemId, status } = req.body || {};

    if (!itemId || !status) {
      return res.status(400).json({
        success: false,
        message: 'itemId and status ("Not Started", "In Progress", "Completed") are required.',
      });
    }

    const roadmap = await updateRoadmapProgress(req.user.id, itemId, status);

    res.status(200).json({
      success: true,
      message: 'Milestone progress updated.',
      data: roadmap,
    });
  } catch (error) {
    console.error('Error updating roadmap progress:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update progress.',
    });
  }
};

/**
 * @desc    Update student's target career role and regenerate roadmap
 * @route   PUT /api/career/target-role (and /api/student/career-goal)
 * @access  Private (Authenticated student)
 */
exports.updateTargetGoal = async (req, res, next) => {
  try {
    const { updateTargetCareerGoal } = require('../services/careerRoadmapService');
    const { targetRole } = req.body || {};

    if (!targetRole || !targetRole.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Target role is required.',
      });
    }

    const roadmap = await updateTargetCareerGoal(req.user.id, targetRole.trim());

    res.status(200).json({
      success: true,
      message: 'Target career updated and roadmap recalculated.',
      data: roadmap,
    });
  } catch (error) {
    console.error('Error updating target career goal:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update career goal.',
    });
  }
};

/**
 * @desc    Get student skill gap breakdown
 * @route   GET /api/career/skill-gap (and /api/student/skill-gap)
 * @access  Private (Authenticated student)
 */
exports.getSkillGaps = async (req, res, next) => {
  try {
    const { getStudentRoadmap } = require('../services/careerRoadmapService');
    const result = await getStudentRoadmap(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        targetRole: result.roadmap?.targetRole,
        currentLevel: result.roadmap?.currentLevel,
        skillGaps: result.roadmap?.skillGaps || [],
        existingStrengths: result.roadmap?.existingStrengths || [],
      },
    });
  } catch (error) {
    console.error('Error fetching skill gaps:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve skill gaps.',
    });
  }
};

