const Insight = require('../models/Insight');
const DNA = require('../models/DNA');
const Analytics = require('../models/Analytics');
const Ranking = require('../models/Ranking');
const Activity = require('../models/Activity');
const aiAnalyzer = require('../services/aiAnalyzer');
const User = require('../models/User');
const { syncGitHubActivities } = require('../services/githubActivityService');

exports.getInsights = async (req, res, next) => {
  try {
    const insight = await Insight.findOne({ userId: req.user.id });
    res.status(200).json({ success: true, data: insight });
  } catch (error) {
    next(error);
  }
};

exports.generateNewInsights = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const { insight, dna, ranking, analytics } = await aiAnalyzer.analyzeUser(user);
    res.status(200).json({ success: true, data: { insight, dna, ranking, analytics } });
  } catch (error) {
    console.error('AI Insights Generation Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI insights. ' + (error.message || ''),
    });
  }
};

exports.getDNA = async (req, res, next) => {
  try {
    const dna = await DNA.findOne({ userId: req.user.id });
    console.log('GET /ai/dna response:', dna);
    res.status(200).json({ success: true, data: dna });
  } catch (error) {
    next(error);
  }
};

exports.getRanking = async (req, res, next) => {
  try {
    const ranking = await Ranking.findOne({ userId: req.user.id });
    res.status(200).json({ success: true, data: ranking });
  } catch (error) {
    next(error);
  }
};

exports.getLeaderboard = async (req, res, next) => {
  try {
    const { PRIVILEGED_ROLES, calculateScoreTier, calculateMedal } = require('../utils/leaderboardHelper');

    const eligibleUsers = await User.find({
      role: { $nin: PRIVILEGED_ROLES },
      status: { $ne: 'suspended' },
      'scores.overall': { $gt: 0 }
    })
    .select('name avatar maviId scores role status platforms')
    .sort({
      'scores.overall': -1,
      'scores.problemSolving': -1,
      'scores.development': -1,
      'maviId': 1,
      '_id': 1
    })
    .limit(50);

    const leaderboard = eligibleUsers.map((u, idx) => {
      const rank = idx + 1;
      const score = u.scores?.overall || 0;
      const medal = calculateMedal(rank);
      const scoreTier = calculateScoreTier(score);

      return {
        _id: u._id,
        rank,
        score,
        medal,
        scoreTier,
        tier: scoreTier,
        user: {
          _id: u._id,
          name: u.name,
          avatar: u.avatar,
          maviId: u.maviId,
          role: u.role
        },
        userId: {
          _id: u._id,
          name: u.name,
          avatar: u.avatar,
          maviId: u.maviId,
          role: u.role
        }
      };
    });

    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    let analytics = await Analytics.find({ userId: req.user.id }).sort({ month: 1 });
    if (!analytics || analytics.length === 0) {
      const user = await User.findById(req.user.id);
      if (user) {
        const result = await aiAnalyzer.analyzeUser(user);
        analytics = result.analytics;
      }
    }
    res.status(200).json({ success: true, data: analytics || [] });
  } catch (error) {
    next(error);
  }
};

exports.getActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find({ userId: req.user.id }).sort({ date: -1 }).limit(50);
    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

exports.syncGitHubActivities = async (req, res, next) => {
  try {
    const activities = await syncGitHubActivities(req.user.id);

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

exports.logActivity = async (req, res, next) => {
  try {
    const activity = await Activity.create({ ...req.body, userId: req.user.id });
    
    // Emit via Socket.io
    const { getIO } = require('../config/socket');
    getIO().to(req.user.id).emit('new_activity', activity);

    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

exports.generateReport = async (req, res, next) => {
  try {
    const PDFDocument = require('pdfkit');

    const user = await User.findById(req.user.id);
    const insight = await Insight.findOne({ userId: req.user.id });
    const dna = await DNA.findOne({ userId: req.user.id });
    const ranking = await Ranking.findOne({ userId: req.user.id });

    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));

    // Header & Title
    doc.fontSize(24).fillColor('#0f172a').text('MAVI Developer Intelligence Report', { align: 'center' });
    doc.moveDown();

    // User info
    doc.fontSize(16).fillColor('#555').text(`Name: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    doc.moveDown();

    // Insight
    if (insight) {
      doc.fontSize(18).fillColor('#222').text(`AI Skill Detection`);
      doc.fontSize(12).fillColor('#444');
      doc.text(`Specialization: ${insight.specialization}`);
      doc.text(`Tech Stack: ${insight.techStack.join(', ')}`);
      doc.text(`Strengths: ${insight.strengths.join(', ')}`);
      doc.text(`Improvements: ${insight.improvements.join(', ')}`);
      doc.moveDown();
    }

    // DNA
    if (dna) {
      doc.fontSize(18).fillColor('#222').text(`Developer DNA Profile`);
      doc.fontSize(12).fillColor('#444');
      doc.text(`Personality: ${dna.personalityType}`);
      doc.text(`Working Style: ${dna.workingStyle}`);
      doc.text(`Collaboration Score: ${dna.scores?.collaboration || 0}`);
      doc.text(`Innovation Score: ${dna.scores?.innovation || 0}`);
      doc.moveDown();
    }

    // Ranking
    if (ranking) {
      doc.fontSize(18).fillColor('#222').text(`Global Ranking`);
      doc.fontSize(12).fillColor('#444');
      doc.text(`Tier: ${ranking.tier}`);
      doc.text(`Score: ${ranking.score}`);
      doc.moveDown();
    }

    doc.end();

    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      const reportUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
      res.status(200).json({ success: true, data: { reportUrl } });
    });
  } catch (error) {
    next(error);
  }
};
