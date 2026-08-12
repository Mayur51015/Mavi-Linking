const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const User = require('../models/User');
const Insight = require('../models/Insight');
const DNA = require('../models/DNA');
const Ranking = require('../models/Ranking');
const Project = require('../models/Project');
const Analytics = require('../models/Analytics');
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
  const query = { _id: candidateId, role: 'user', isPublic: true };

  if (recruiter.allowedColleges?.length) {
    query['university.name'] = {
      $in: recruiter.allowedColleges.map((college) => new RegExp(`^${escapeRegex(college)}$`, 'i')),
    };
  }

  if (recruiter.allowedDepartments?.length) {
    query['university.department'] = {
      $in: recruiter.allowedDepartments.map((department) => new RegExp(`^${escapeRegex(department)}$`, 'i')),
    };
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

  let [insight, dna, ranking, projects, analytics] = await Promise.all([
    Insight.findOne({ userId: user._id }).lean(),
    DNA.findOne({ userId: user._id }).lean(),
    Ranking.findOne({ userId: user._id }).lean(),
    Project.find({ user: user._id }).sort({ featured: -1, updatedAt: -1 }).lean(),
    Analytics.findOne({ userId: user._id }).sort({ month: -1, updatedAt: -1 }).lean(),
  ]);

  let aiData = user.aiAnalysis || {};
  let aiAvailable = Boolean(insight || dna || ranking || analytics);

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
        strengths: analysis.insight?.strengths || aiData.strengths || [],
        weaknesses: analysis.insight?.improvements || aiData.weaknesses || [],
        recommendedRoles: analysis.insight?.careerRecommendations || aiData.recommendedRoles || [],
        hiringRecommendation: aiData.hiringRecommendation || '',
      };
    }
  } catch (error) {
    console.warn(`Recruiter report AI fallback for ${user._id}: ${error.message}`);
  }

  const publicProfile = user.username
    ? `${process.env.CLIENT_URL || 'http://localhost:5173'}/u/${user.username}`
    : null;

  let qrDataUrl = null;
  if (publicProfile) {
    try {
      qrDataUrl = await QRCode.toDataURL(publicProfile, { margin: 1, width: 120 });
    } catch (error) {
      console.warn(`Recruiter report QR generation skipped for ${user._id}: ${error.message}`);
    }
  }

  return {
    candidate: user,
    insight,
    dna,
    ranking,
    projects,
    analytics,
    aiData,
    aiAvailable,
    generatedAt: new Date(),
    publicProfile,
    qrDataUrl,
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

  writeSection(doc, 'Projects', report.projects.length
    ? report.projects.map((project) => `${project.title}: ${project.description} | Technologies: ${toText(project.technologies)}${project.githubUrl ? ` | GitHub: ${project.githubUrl}` : ''}`)
    : ['No projects available.']);

  writeSection(doc, 'Certifications & Achievements', [
    ...(candidate.certificates || []).map((certificate) => `Certification: ${certificate.title} — ${certificate.issuer || 'Issuer unavailable'}${certificate.credentialId ? ` — Credential: ${certificate.credentialId}` : ''}`),
    ...(candidate.achievements || []).map((achievement) => `Achievement: ${achievement.title} — ${achievement.category || 'Other'}${achievement.description ? ` — ${achievement.description}` : ''}`),
    ...(candidate.certificates?.length || candidate.achievements?.length ? [] : ['No certifications or achievements available.']),
  ]);

  writeSection(doc, 'GitHub & Coding Profiles', [
    `GitHub: ${toText(candidate.platforms?.github?.username || candidate.githubUsername)}`,
    `LeetCode: ${toText(candidate.platforms?.leetcode?.username)}`,
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
    if (report.qrDataUrl) {
      doc.image(report.qrDataUrl, { fit: [100, 100], align: 'center' });
      doc.fontSize(8).fillColor('#777').text('Scan to open the candidate public profile.', { align: 'center' });
    }
  }

  doc.fontSize(8).fillColor('#888').text('Confidential recruiter report. Access only for authorized recruitment purposes.', 45, 770, { align: 'center', width: 505 });
  doc.end();
};

module.exports = { generateRecruiterReport, writeRecruiterReportPdf };
