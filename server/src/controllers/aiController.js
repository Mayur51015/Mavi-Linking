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
    const leaderboard = await Ranking.find().populate('userId', 'name avatar').sort({ score: -1 }).limit(50);
    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const analytics = await Analytics.find({ userId: req.user.id }).sort({ month: 1 });
    res.status(200).json({ success: true, data: analytics });
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

    // The PDF is written straight to the response rather than to
    // server/public/reports. That directory was served by express.static, so
    // every report — which carries the user's name and email — was readable by
    // anyone who could guess the filename, and the filename was
    // `report_<userId>_<timestamp>.pdf` with a user id that /api/public/u
    // already hands out. Streaming also removes the race in the old code: it
    // returned a URL right after doc.end(), before the write stream had
    // flushed, so a quick client could fetch a truncated PDF. And nothing ever
    // cleaned the directory up.
    const fileName = `mavi-report-${req.user.id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');

    const doc = new PDFDocument({ margin: 50 });

    // If PDFKit fails mid-stream the response is already partly written, so
    // the only honest thing left is to end it — next() would try to send JSON
    // over a body that has started.
    doc.on('error', (error) => {
      console.error('Report generation failed:', error.message);
      res.end();
    });

    doc.pipe(res);

    // Title
    doc.fontSize(24).fillColor('#333').text(`AI Developer Report`, { align: 'center' });
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
      doc.text(`Collaboration Score: ${dna.scores.collaboration}`);
      doc.text(`Innovation Score: ${dna.scores.innovation}`);
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
  } catch (error) {
    // Only safe while nothing has been written yet; once piping starts the
    // handler above owns the failure.
    if (res.headersSent) {
      return res.end();
    }
    return next(error);
  }

  return undefined;
};
