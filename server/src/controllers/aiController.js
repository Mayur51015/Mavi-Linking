const Insight = require('../models/Insight');
const DNA = require('../models/DNA');
const Analytics = require('../models/Analytics');
const Ranking = require('../models/Ranking');
const Activity = require('../models/Activity');
const aiAnalyzer = require('../services/aiAnalyzer');
const User = require('../models/User');

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
    const path = require('path');
    const fs = require('fs');

    const user = await User.findById(req.user.id);
    const insight = await Insight.findOne({ userId: req.user.id });
    const dna = await DNA.findOne({ userId: req.user.id });
    const ranking = await Ranking.findOne({ userId: req.user.id });

    // Ensure directory exists
    const reportsDir = path.join(__dirname, '..', '..', 'public', 'reports');
    if (!fs.existsSync(reportsDir)){
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `report_${req.user.id}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(fs.createWriteStream(filePath));

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

    const reportUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}/public/reports/${fileName}`;
    
    res.status(200).json({ success: true, data: { reportUrl } });
  } catch (error) {
    next(error);
  }
};
