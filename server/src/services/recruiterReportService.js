const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const User = require('../models/User');
const Insight = require('../models/Insight');
const DNA = require('../models/DNA');
const Ranking = require('../models/Ranking');
const Project = require('../models/Project');
const Analytics = require('../models/Analytics');
const CareerScore = require('../models/CareerScore');
const CareerInsight = require('../models/CareerInsight');
const LeetCodeAnalytics = require('../models/LeetCodeAnalytics');
const aiAnalyzer = require('./aiAnalyzer');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toText = (value, fallback = 'Not available') => {
  if (value === null || value === undefined || value === '') return fallback;
  if (Array.isArray(value)) return value.length ? value.join(', ') : fallback;
  if (value instanceof Map) return Array.from(value.entries()).map(([k, v]) => `${k}: ${v}`).join(', ') || fallback;
  if (typeof value === 'object') return Object.entries(value).map(([k, v]) => `${k}: ${toText(v)}`).join(', ') || fallback;
  return String(value);
};

const scopedCandidateQuery = (candidateId, recruiter) => {
  const query = { _id: candidateId, role: { $in: ['user', 'developer', 'student'] }, isPublic: { $ne: false } };

  if (!recruiter || recruiter.role === 'admin') {
    return query;
  }

  const scopeConditions = [];
  if (recruiter.allowedColleges?.length) {
    scopeConditions.push({
      'university.name': {
        $in: recruiter.allowedColleges.map((college) => new RegExp(escapeRegex(college), 'i')),
      },
    });
  }

  if (recruiter.allowedDepartments?.length) {
    scopeConditions.push({
      'university.department': {
        $in: recruiter.allowedDepartments.map((department) => new RegExp(escapeRegex(department), 'i')),
      },
    });
  }

  if (scopeConditions.length > 0) {
    const unaffiliatedCondition = {
      $or: [
        { 'university.name': { $in: ['', null] } },
        { 'university.name': { $exists: false } },
      ],
    };
    query.$or = [...scopeConditions, unaffiliatedCondition];
  }

  return query;
};

const generateRecruiterReport = async (candidateId, recruiter) => {
  if (!candidateId || !/^[a-fA-F0-9]{24}$/.test(String(candidateId))) {
    const error = new Error('Invalid candidate ID');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne(scopedCandidateQuery(candidateId, recruiter)).lean();
  if (!user) {
    const error = new Error('Candidate not found or outside your authorized access scope');
    error.statusCode = 404;
    throw error;
  }

  let [insight, dna, ranking, projects, analytics, careerScore, careerInsight, leetcodeData] = await Promise.all([
    Insight.findOne({ userId: user._id }).lean().catch(() => null),
    DNA.findOne({ userId: user._id }).lean().catch(() => null),
    Ranking.findOne({ userId: user._id }).lean().catch(() => null),
    Project.find({ user: user._id }).sort({ featured: -1, updatedAt: -1 }).lean().catch(() => []),
    Analytics.findOne({ userId: user._id }).sort({ month: -1, updatedAt: -1 }).lean().catch(() => null),
    CareerScore.findOne({ user: user._id }).lean().catch(() => null),
    CareerInsight.findOne({ user: user._id }).lean().catch(() => null),
    LeetCodeAnalytics.findOne({ user: user._id }).lean().catch(() => null),
  ]);

  // Compute live global rank matching backend source of truth
  let globalRank = null;
  if (user.scores && user.scores.overall > 0) {
    const higherScoresCount = await User.countDocuments({
      'scores.overall': { $gt: user.scores.overall },
    });
    globalRank = higherScoresCount + 1;
  }

  const rankingData = {
    globalRank: globalRank ? `#${globalRank.toLocaleString()}` : (ranking?.globalRank ? `#${ranking.globalRank}` : 'Unranked'),
    tier: ranking?.tier || (user.scores?.overall > 800 ? 'Elite Developer' : user.scores?.overall > 600 ? 'Gold' : user.scores?.overall > 400 ? 'Silver' : 'Bronze'),
    score: user.scores?.overall || careerScore?.overall || 0,
    universityRank: ranking?.universityRank || 'N/A',
    departmentRank: ranking?.departmentRank || 'N/A',
  };

  let aiData = user.aiAnalysis || {};
  let aiAvailable = Boolean(insight || dna || ranking || analytics || careerInsight);

  try {
    const analysis = await Promise.race([
      aiAnalyzer.analyzeUser(user),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI analysis timeout')), 12000)),
    ]);

    if (analysis) {
      aiAvailable = true;
      insight = analysis.insight || insight;
      dna = analysis.dna || dna;
      ranking = analysis.ranking || ranking;
      analytics = analysis.analytics || analytics;
      aiData = {
        ...aiData,
        strengths: analysis.insight?.strengths || aiData.strengths || careerInsight?.strengths || [],
        weaknesses: analysis.insight?.improvements || aiData.weaknesses || careerInsight?.improvements || [],
        recommendedRoles: analysis.insight?.careerRecommendations || aiData.recommendedRoles || careerInsight?.recommendedRoles || [],
        hiringRecommendation: aiData.hiringRecommendation || careerInsight?.hiringRecommendation || '',
      };
    }
  } catch (error) {
    console.warn(`Recruiter report AI fallback for ${user._id}: ${error.message}`);
  }

  const publicProfile = user.username
    ? `${process.env.CLIENT_URL || 'http://localhost:5173'}/u/${user.username}`
    : null;

  let qrBuffer = null;
  if (publicProfile) {
    try {
      qrBuffer = await QRCode.toBuffer(publicProfile, { margin: 1, width: 120 });
    } catch (error) {
      console.warn(`Recruiter report QR generation skipped for ${user._id}: ${error.message}`);
    }
  }

  return {
    candidate: user,
    insight: insight || careerInsight,
    dna,
    ranking: rankingData,
    projects: projects || [],
    analytics,
    leetcodeData,
    aiData,
    aiAvailable,
    generatedAt: new Date(),
    publicProfile,
    qrBuffer,
  };
};

const writeSection = (doc, title, lines) => {
  if (doc.y > 700) doc.addPage();
  doc.moveDown(0.5);
  doc.fontSize(16).fillColor('#222').text(title);
  doc.moveDown(0.2);
  doc.fontSize(10).fillColor('#444');
  lines.forEach((line) => doc.text(line, { lineGap: 2 }));
};

const writeRecruiterReportPdf = async (report, res) => {
  const candidate = report.candidate;
  const fileName = 'MAVI-Linking-Recruiter-AI-Report.pdf';

  res.status(200);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Cache-Control', 'no-store');

  const doc = new PDFDocument({ size: 'A4', margin: 45 });
  doc.pipe(res);

  doc.fontSize(25).fillColor('#111').text('MAVI-Linking', { align: 'center' });
  doc.fontSize(18).fillColor('#333').text('Recruiter AI Candidate Report', { align: 'center' });
  doc.fontSize(9).fillColor('#777').text(`Generated: ${report.generatedAt.toLocaleString()}`, { align: 'center' });
  doc.moveDown();

  writeSection(doc, 'Candidate Information', [
    `Name: ${toText(candidate.name)}`,
    `Email: ${toText(candidate.email)}`,
    `Username: ${toText(candidate.username)}`,
    `University: ${toText(candidate.university?.name)}`,
    `Department: ${toText(candidate.university?.department)}`,
    `Batch: ${toText(candidate.university?.batch)}`,
    `Degree: ${toText(candidate.degree)}`,
    `CGPA: ${toText(candidate.cgpa)}`,
    `Graduation Year: ${toText(candidate.graduationYear)}`,
    `Preferred Domain: ${toText(candidate.preferredDomain)}`,
    `Experience Level: ${toText(candidate.experienceLevel)}`,
  ]);

  writeSection(doc, 'Skills & Technical Profile', [
    `Verified/Listed Skills: ${toText(candidate.skillsList?.map((skill) => skill.name))}`,
    `AI Top Skills: ${toText(report.insight?.topSkills)}`,
    `Technology Stack: ${toText(report.insight?.techStack)}`,
    `Specialization: ${toText(report.insight?.specialization)}`,
    `Development Score: ${toText(candidate.scores?.development)}`,
    `Problem Solving Score: ${toText(candidate.scores?.problemSolving)}`,
    `Knowledge Score: ${toText(candidate.scores?.knowledge)}`,
    `Overall Score: ${toText(candidate.scores?.overall)}`,
  ]);

  writeSection(doc, 'Projects', report.projects && report.projects.length
    ? report.projects.map((project) => `${project.title}: ${project.description} | Technologies: ${toText(project.technologies)}${project.githubUrl ? ` | GitHub: ${project.githubUrl}` : ''}`)
    : ['No projects available.']);

  writeSection(doc, 'Certifications & Achievements', [
    ...(candidate.certificates || []).map((certificate) => `Certification: ${certificate.title} — ${certificate.issuer || 'Issuer unavailable'}${certificate.credentialId ? ` — Credential: ${certificate.credentialId}` : ''}`),
    ...(candidate.achievements || []).map((achievement) => `Achievement: ${achievement.title} — ${achievement.category || 'Other'}${achievement.description ? ` — ${achievement.description}` : ''}`),
    ...(candidate.certificates?.length || candidate.achievements?.length ? [] : ['No certifications or achievements available.']),
  ]);

  const lcUsername = candidate.platforms?.leetcode?.username || report.leetcodeData?.username;
  const lcStats = report.leetcodeData;
  const lcText = lcStats
    ? `${lcUsername} (Total Solved: ${lcStats.totalSolved || 0} [Easy: ${lcStats.easySolved || 0}, Medium: ${lcStats.mediumSolved || 0}, Hard: ${lcStats.hardSolved || 0}])`
    : lcUsername
    ? `${lcUsername} (Stats not synced)`
    : 'Not connected';

  writeSection(doc, 'GitHub & Coding Profiles', [
    `GitHub: ${toText(candidate.platforms?.github?.username || candidate.githubUsername)}`,
    `LeetCode: ${lcText}`,
    `Codeforces: ${toText(candidate.platforms?.codeforces?.username)}`,
    `Stack Overflow: ${toText(candidate.platforms?.stackoverflow?.username)}`,
    `Portfolio: ${toText(candidate.portfolioWebsite)}`,
  ]);

  writeSection(doc, 'Developer DNA', [
    `Personality: ${toText(report.dna?.personalityType)}`,
    `Working Style: ${toText(report.dna?.workingStyle)}`,
    `Collaboration: ${toText(report.dna?.scores?.collaboration)}`,
    `Innovation: ${toText(report.dna?.scores?.innovation)}`,
    `Learning Adaptability: ${toText(report.dna?.scores?.learningAdaptability)}`,
    `Consistency: ${toText(report.dna?.scores?.consistency)}`,
    `DNA Description: ${toText(report.dna?.description)}`,
  ]);

  writeSection(doc, 'Ranking & Placement Readiness', [
    `Tier: ${toText(report.ranking?.tier)}`,
    `Global Rank: ${toText(report.ranking?.globalRank)}`,
    `Ranking Score: ${toText(report.ranking?.score)}`,
    `University Rank: ${toText(report.ranking?.universityRank)}`,
    `Department Rank: ${toText(report.ranking?.departmentRank)}`,
    `Profile Completion: ${toText(candidate.profileCompletion)}%`,
    `Placement Readiness: ${toText(candidate.placementReadinessScore)}%`,
    `Placement Status: ${toText(candidate.placementStatus)}`,
  ]);

  writeSection(doc, 'AI Summary & Recommendation', [
    `AI Analysis Status: ${report.aiAvailable ? 'Available' : 'Temporarily unavailable — report generated from verified profile/database data.'}`,
    `AI Summary: ${toText(report.insight?.rawAiSummary || report.analytics?.aiSummary)}`,
    `Strengths: ${toText(report.insight?.strengths || report.aiData?.strengths)}`,
    `Improvement Areas: ${toText(report.insight?.improvements || report.aiData?.weaknesses)}`,
    `Recommended Roles: ${toText(report.insight?.careerRecommendations || report.aiData?.recommendedRoles)}`,
    `Recruiter Recommendation: ${toText(candidate.aiAnalysis?.hiringRecommendation || report.analytics?.careerInsight)}`,
  ]);

  if (report.publicProfile) {
    writeSection(doc, 'Public Profile', [`Profile: ${report.publicProfile}`]);
    if (report.qrBuffer) {
      try {
        doc.image(report.qrBuffer, { fit: [100, 100], align: 'center' });
        doc.fontSize(8).fillColor('#777').text('Scan to open the candidate public profile.', { align: 'center' });
      } catch (qrErr) {
        console.warn(`Failed to embed QR code image in PDF: ${qrErr.message}`);
      }
    }
  }

  doc.fontSize(8).fillColor('#888').text('Confidential recruiter report. Access only for authorized recruitment purposes.', 45, 770, { align: 'center', width: 505 });
  doc.end();
};

module.exports = { generateRecruiterReport, writeRecruiterReportPdf };
