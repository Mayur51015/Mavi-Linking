const PDFDocument = require('pdfkit');
const User = require('../models/User');
const Department = require('../models/Department');
const { calculateScoreTier } = require('../utils/leaderboardHelper');

/**
 * Format date for display
 */
const formatDateTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return new Date().toLocaleString();
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

/**
 * Build department & institution scope query from request object
 */
const buildScopeQuery = (req, baseRoleQuery = {}) => {
  const query = { ...baseRoleQuery };

  if (req.departmentScope?.departmentId) {
    query.departmentId = req.departmentScope.departmentId;
  } else if (req.user?.departmentId) {
    query.departmentId = req.user.departmentId;
  }

  if (req.departmentScope?.institutionId) {
    query.institutionId = req.departmentScope.institutionId;
  } else if (req.user?.institutionId) {
    query.institutionId = req.user.institutionId;
  }

  return query;
};

/**
 * Generate normalized department performance report data
 */
const generateDepartmentReportData = async (req) => {
  const departmentId = req.departmentScope?.departmentId || req.user?.departmentId;
  const department = departmentId
    ? await Department.findById(departmentId).populate('institutionId', 'name code tenantId')
    : null;

  const departmentName = department?.name || req.user?.university?.department || 'Department Administration';
  const departmentCode = department?.code || '';
  const institutionName = department?.institutionId?.name || req.user?.university?.name || 'Zeal College';

  const query = buildScopeQuery(req, { role: { $in: ['user', 'student', 'developer'] } });
  const students = await User.find(query)
    .select('name email maviId prn scores status accountStatus isVerified skillsList platforms placementStatus placementReadinessScore profileCompletion createdAt')
    .sort({ 'scores.overall': -1, createdAt: -1 })
    .lean();

  const totalStudents = students.length;
  let activeStudents = 0;
  let verifiedStudents = 0;
  let totalScore = 0;
  let totalDev = 0;
  let totalProblem = 0;
  let totalKnowledge = 0;
  let totalReadiness = 0;
  let totalProfileComp = 0;
  let githubLinkedCount = 0;
  let leetcodeLinkedCount = 0;

  const tierDistribution = { Beginner: 0, Developing: 0, Intermediate: 0, Advanced: 0, Expert: 0, Exceptional: 0 };
  const skillCounts = {};

  const normalizedStudents = students.map((s, index) => {
    const overall = s.scores?.overall || 0;
    const dev = s.scores?.development || 0;
    const ps = s.scores?.problemSolving || 0;
    const know = s.scores?.knowledge || 0;

    totalScore += overall;
    totalDev += dev;
    totalProblem += ps;
    totalKnowledge += know;

    if (s.placementReadinessScore) totalReadiness += s.placementReadinessScore;
    if (s.profileCompletion) totalProfileComp += s.profileCompletion;

    if (s.status === 'active' || s.accountStatus === 'ACTIVE') activeStudents++;
    if (s.isVerified || s.accountStatus === 'ACTIVE') verifiedStudents++;

    if (s.platforms?.github?.username) githubLinkedCount++;
    if (s.platforms?.leetcode?.username) leetcodeLinkedCount++;

    const tier = calculateScoreTier(overall);
    tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;

    (s.skillsList || []).forEach((sk) => {
      const name = typeof sk === 'string' ? sk : sk?.name;
      if (name) skillCounts[name] = (skillCounts[name] || 0) + 1;
    });

    return {
      rank: index + 1,
      id: s._id,
      name: s.name || 'Unnamed Student',
      email: s.email || 'N/A',
      maviId: s.maviId || `MAVI-${s._id.toString().slice(-8).toUpperCase()}`,
      prn: s.prn || 'Pending',
      status: s.status || 'active',
      accountStatus: s.accountStatus || 'ACTIVE',
      isVerified: Boolean(s.isVerified),
      scores: {
        development: dev,
        problemSolving: ps,
        knowledge: know,
        overall: overall,
      },
      tier,
      platforms: {
        github: s.platforms?.github?.username || null,
        leetcode: s.platforms?.leetcode?.username || null,
      },
      placementStatus: s.placementStatus || 'Available for Hiring',
      placementReadinessScore: s.placementReadinessScore || 0,
      profileCompletion: s.profileCompletion || 0,
    };
  });

  const divisor = totalStudents || 1;
  const topSkills = Object.entries(skillCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const summary = {
    totalStudents,
    activeStudents,
    verifiedStudents,
    averageScores: {
      overall: Math.round(totalScore / divisor),
      development: Math.round(totalDev / divisor),
      problemSolving: Math.round(totalProblem / divisor),
      knowledge: Math.round(totalKnowledge / divisor),
    },
    averagePlacementReadiness: Math.round(totalReadiness / divisor),
    averageProfileCompletion: Math.round(totalProfileComp / divisor),
    platformStats: {
      githubLinked: githubLinkedCount,
      leetcodeLinked: leetcodeLinkedCount,
    },
    tierDistribution,
    topSkills,
  };

  return {
    institutionName,
    departmentName,
    departmentCode,
    generatedAt: new Date().toISOString(),
    totalRecords: totalStudents,
    reportType: 'DEPARTMENT_STUDENT_PERFORMANCE',
    summary,
    students: normalizedStudents,
  };
};

/**
 * Draw a horizontal progress bar in PDFKit
 */
const drawProgressBar = (doc, x, y, width, height, current, max = 1000, color = '#4f46e5', label = '') => {
  const validMax = max > 0 ? max : 1000;
  const ratio = Math.min(Math.max(current / validMax, 0), 1);
  const fillWidth = Math.max(width * ratio, 2);

  // Background
  doc.rect(x, y, width, height).fill('#e2e8f0');

  // Fill
  if (fillWidth > 0) {
    doc.rect(x, y, fillWidth, height).fill(color);
  }

  // Label & score text
  doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold');
  doc.text(label, x, y - 11);
  doc.fillColor('#0f172a').fontSize(8).font('Helvetica');
  doc.text(`${current}/${max}`, x + width - 50, y - 11, { width: 50, align: 'right' });
};

/**
 * Generate and stream Department Performance Report PDF
 */
const writeDepartmentReportPdf = async (reportData, res) => {
  const cleanDept = (reportData.departmentName || 'Department')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `MAVI_Department_Performance_Report_${cleanDept}_${dateStr}.pdf`;

  res.status(200);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Cache-Control', 'no-store');

  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    bufferPages: true,
  });

  doc.pipe(res);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const contentWidth = pageWidth - 80;

  // ─── HEADER SECTION ────────────────────────────────────────────────────────
  // Primary brand banner background
  doc.rect(40, 40, contentWidth, 68).fill('#0f172a');

  // Brand title
  doc.fillColor('#818cf8').fontSize(11).font('Helvetica-Bold').text('MAVI LINKING', 55, 52, { characterSpacing: 1.5 });
  doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('Department Performance Report', 55, 68);
  doc.fillColor('#94a3b8').fontSize(8).font('Helvetica').text('Official Department-Scoped Analytics & Student Assessment Record', 55, 88);

  // Metadata Card
  const metaY = 118;
  doc.rect(40, metaY, contentWidth, 54).fillAndStroke('#f8fafc', '#e2e8f0');

  // Left column: Institution & Department
  doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('INSTITUTION:', 55, metaY + 10);
  doc.fillColor('#0f172a').fontSize(9).font('Helvetica').text(reportData.institutionName || 'N/A', 125, metaY + 10, { width: 170 });

  doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('DEPARTMENT:', 55, metaY + 28);
  doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(reportData.departmentName || 'N/A', 125, metaY + 28, { width: 170 });

  // Right column: Generated Date & Total Records
  doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('GENERATED:', 320, metaY + 10);
  doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica').text(formatDateTime(reportData.generatedAt), 395, metaY + 10, { width: 150 });

  doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('TOTAL RECORDS:', 320, metaY + 28);
  doc.fillColor('#4f46e5').fontSize(9.5).font('Helvetica-Bold').text(`${reportData.totalRecords} Students`, 405, metaY + 27);

  // ─── KPI SUMMARY OVERVIEW ──────────────────────────────────────────────────
  const kpiY = 182;
  doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Department Overview & Key Metrics', 40, kpiY);

  const cardWidth = (contentWidth - 15) / 4;
  const cardHeight = 44;
  const kpiTop = kpiY + 16;

  const kpis = [
    { label: 'TOTAL STUDENTS', value: `${reportData.summary.totalStudents}`, color: '#4f46e5' },
    { label: 'ACTIVE STUDENTS', value: `${reportData.summary.activeStudents}`, color: '#059669' },
    { label: 'AVG MAVI SCORE', value: `${reportData.summary.averageScores.overall} pts`, color: '#7c3aed' },
    { label: 'AVG DEV SCORE', value: `${reportData.summary.averageScores.development} pts`, color: '#0284c7' },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = 40 + idx * (cardWidth + 5);
    doc.rect(cardX, kpiTop, cardWidth, cardHeight).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text(kpi.label, cardX + 8, kpiTop + 8);
    doc.fillColor(kpi.color).fontSize(13).font('Helvetica-Bold').text(kpi.value, cardX + 8, kpiTop + 22);
  });

  // ─── SCORE BENCHMARKS & VISUALIZATION ──────────────────────────────────────
  const vizY = kpiTop + cardHeight + 14;
  doc.rect(40, vizY, contentWidth, 54).fillAndStroke('#f8fafc', '#e2e8f0');

  const barW = (contentWidth - 40) / 3;
  const barY = vizY + 28;

  drawProgressBar(doc, 55, barY, barW, 8, reportData.summary.averageScores.development, 1000, '#0284c7', 'Average Development');
  drawProgressBar(doc, 55 + barW + 15, barY, barW, 8, reportData.summary.averageScores.problemSolving, 1000, '#059669', 'Average Problem Solving');
  drawProgressBar(doc, 55 + (barW + 15) * 2, barY, barW, 8, reportData.summary.averageScores.overall, 1000, '#7c3aed', 'Average Overall MAVI');

  // ─── STUDENT PERFORMANCE TABLE ─────────────────────────────────────────────
  let tableStartY = vizY + 68;
  doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Student Performance Breakdown', 40, tableStartY);
  tableStartY += 14;

  const drawTableHeader = (yPos) => {
    doc.rect(40, yPos, contentWidth, 20).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
    doc.text('#', 45, yPos + 6, { width: 20 });
    doc.text('Student Name & Email', 70, yPos + 6, { width: 145 });
    doc.text('MAVI ID / PRN', 220, yPos + 6, { width: 115 });
    doc.text('Dev', 340, yPos + 6, { width: 35, align: 'right' });
    doc.text('Problem', 380, yPos + 6, { width: 45, align: 'right' });
    doc.text('Overall', 430, yPos + 6, { width: 40, align: 'right' });
    doc.text('Status', 480, yPos + 6, { width: 65, align: 'center' });
    return yPos + 20;
  };

  let currentY = drawTableHeader(tableStartY);

  if (reportData.students.length === 0) {
    // Empty state card
    doc.rect(40, currentY, contentWidth, 60).fillAndStroke('#ffffff', '#e2e8f0');
    doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(
      'No performance records are currently available for this department.',
      40,
      currentY + 24,
      { width: contentWidth, align: 'center' }
    );
  } else {
    reportData.students.forEach((std, idx) => {
      const rowHeight = 26;

      // Check if row exceeds page height boundary
      if (currentY + rowHeight > pageHeight - 55) {
        doc.addPage();
        currentY = drawTableHeader(40);
      }

      // Alternating row background
      const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(40, currentY, contentWidth, rowHeight).fillAndStroke(bgColor, '#f1f5f9');

      // Rank
      doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text(`${std.rank}`, 45, currentY + 8, { width: 20 });

      // Student Name & Email
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(std.name, 70, currentY + 4, { width: 145, ellipsis: true });
      doc.fillColor('#64748b').fontSize(7).font('Helvetica').text(std.email, 70, currentY + 14, { width: 145, ellipsis: true });

      // MAVI ID / PRN
      doc.fillColor('#4f46e5').fontSize(7.5).font('Helvetica-Bold').text(std.maviId, 220, currentY + 4, { width: 115, ellipsis: true });
      doc.fillColor('#0284c7').fontSize(7).font('Helvetica').text(std.prn ? `PRN: ${std.prn}` : 'PRN: Pending', 220, currentY + 14, { width: 115, ellipsis: true });

      // Scores
      doc.fillColor('#0284c7').fontSize(8).font('Helvetica-Bold').text(`${std.scores.development}`, 340, currentY + 8, { width: 35, align: 'right' });
      doc.fillColor('#059669').fontSize(8).font('Helvetica-Bold').text(`${std.scores.problemSolving}`, 380, currentY + 8, { width: 45, align: 'right' });
      doc.fillColor('#7c3aed').fontSize(8.5).font('Helvetica-Bold').text(`${std.scores.overall}`, 430, currentY + 8, { width: 40, align: 'right' });

      // Status pill text
      const statusText = (std.status || 'Active').toUpperCase();
      doc.fillColor(std.status === 'active' || std.accountStatus === 'ACTIVE' ? '#059669' : '#e11d48')
        .fontSize(7)
        .font('Helvetica-Bold')
        .text(statusText, 480, currentY + 8, { width: 65, align: 'center' });

      currentY += rowHeight;
    });
  }

  // ─── FOOTER (ON ALL PAGES) ─────────────────────────────────────────────────
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    const footerY = pageHeight - 30;

    // Divider line
    doc.moveTo(40, footerY - 6).lineTo(pageWidth - 40, footerY - 6).strokeColor('#e2e8f0').stroke();

    // Footer text
    doc.fillColor('#64748b').fontSize(7.5).font('Helvetica');
    doc.text('MAVI Linking — Department Performance Report', 40, footerY, { width: 220, align: 'left' });
    doc.text(`Generated: ${formatDateTime(reportData.generatedAt)}`, 220, footerY, { width: 160, align: 'center' });
    doc.text(`Page ${i + 1} of ${pages.count}`, pageWidth - 140, footerY, { width: 100, align: 'right' });
  }

  doc.end();
};

module.exports = {
  generateDepartmentReportData,
  writeDepartmentReportPdf,
};
