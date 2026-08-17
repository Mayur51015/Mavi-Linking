const mongoose = require('mongoose');
const { Writable } = require('stream');
const QRCode = require('qrcode');
const { generateRecruiterReport, writeRecruiterReportPdf } = require('../src/services/recruiterReportService');
const User = require('../src/models/User');
const Insight = require('../src/models/Insight');
const DNA = require('../src/models/DNA');
const Ranking = require('../src/models/Ranking');
const Project = require('../src/models/Project');
const Analytics = require('../src/models/Analytics');
const CareerScore = require('../src/models/CareerScore');
const CareerInsight = require('../src/models/CareerInsight');
const LeetCodeAnalytics = require('../src/models/LeetCodeAnalytics');
const aiAnalyzer = require('../src/services/aiAnalyzer');

describe('Recruiter Report Service', () => {
  let candidateUser;
  let recruiterUser;
  let adminUser;
  let validQrBuffer;

  beforeAll(async () => {
    validQrBuffer = await QRCode.toBuffer('http://localhost:5173/u/janedev');

    candidateUser = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Jane Developer',
      email: 'jane@example.com',
      username: 'janedev',
      role: 'user',
      isPublic: true,
      university: { name: 'MIT', department: 'Computer Science', batch: '2025' },
      scores: { development: 90, problemSolving: 85, knowledge: 88, overall: 88 },
      skillsList: [{ name: 'React' }, { name: 'Node.js' }],
    };

    recruiterUser = {
      _id: new mongoose.Types.ObjectId(),
      role: 'recruiter',
      allowedColleges: ['MIT', 'Stanford'],
      allowedDepartments: ['Computer Science'],
    };

    adminUser = {
      _id: new mongoose.Types.ObjectId(),
      role: 'admin',
    };
  });

  beforeEach(() => {
    jest.spyOn(aiAnalyzer, 'analyzeUser').mockResolvedValue({
      insight: { topSkills: ['JavaScript', 'React'], techStack: ['Node.js', 'Express'], specialization: 'Full Stack' },
      dna: { personalityType: 'Problem Solver', workingStyle: 'Collaborative', scores: { collaboration: 90, innovation: 85 } },
      ranking: { tier: 'Gold', globalRank: 42, score: 950 },
      analytics: { aiSummary: 'Top candidate' },
    });

    jest.spyOn(Insight, 'findOne').mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    jest.spyOn(DNA, 'findOne').mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    jest.spyOn(Ranking, 'findOne').mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    jest.spyOn(Project, 'find').mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
    });
    jest.spyOn(Analytics, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });
    jest.spyOn(CareerScore, 'findOne').mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    jest.spyOn(CareerInsight, 'findOne').mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    jest.spyOn(LeetCodeAnalytics, 'findOne').mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    jest.spyOn(User, 'countDocuments').mockResolvedValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateRecruiterReport', () => {
    it('throws 400 error for invalid candidate ID', async () => {
      await expect(generateRecruiterReport('invalid-id', recruiterUser)).rejects.toThrow('Invalid candidate ID');
    });

    it('generates report for valid candidate within recruiter access scope', async () => {
      jest.spyOn(User, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(candidateUser),
      });

      const report = await generateRecruiterReport(candidateUser._id.toString(), recruiterUser);

      expect(report).toBeDefined();
      expect(report.candidate.name).toBe('Jane Developer');
      expect(report.qrBuffer).toBeDefined();
      expect(Buffer.isBuffer(report.qrBuffer)).toBe(true);
      expect(report.publicProfile).toContain('/u/janedev');
      expect(report.aiAvailable).toBe(true);
    });

    it('allows admin user to access any candidate profile', async () => {
      jest.spyOn(User, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(candidateUser),
      });

      const report = await generateRecruiterReport(candidateUser._id.toString(), adminUser);
      expect(report.candidate).toBeDefined();
    });

    it('throws 404 if candidate is not found or outside recruiter scope', async () => {
      jest.spyOn(User, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(generateRecruiterReport(candidateUser._id.toString(), recruiterUser))
        .rejects.toThrow('Candidate not found or outside your authorized access scope');
    });

    it('falls back to verified profile data when the AI service fails', async () => {
      jest.spyOn(User, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(candidateUser),
      });
      aiAnalyzer.analyzeUser.mockRejectedValueOnce(new Error('AI service unavailable'));

      const report = await generateRecruiterReport(candidateUser._id.toString(), recruiterUser);

      expect(report.candidate.name).toBe('Jane Developer');
      expect(report.aiAvailable).toBe(false);
      expect(report.projects).toEqual([]);
      expect(report.publicProfile).toContain('/u/janedev');
    });
  });

  describe('writeRecruiterReportPdf', () => {
    it('sets correct response headers and emits a valid PDF binary response', async () => {
      const report = {
        candidate: candidateUser,
        insight: { topSkills: ['React'] },
        dna: { personalityType: 'Problem Solver' },
        ranking: { tier: 'Gold' },
        projects: [],
        aiAvailable: true,
        generatedAt: new Date(),
        publicProfile: 'http://localhost:5173/u/janedev',
        qrBuffer: validQrBuffer,
      };

      const chunks = [];
      const responseStream = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(Buffer.from(chunk));
          callback();
        },
      });
      responseStream.status = jest.fn().mockReturnThis();
      responseStream.setHeader = jest.fn();

      const finished = new Promise((resolve, reject) => {
        responseStream.once('finish', resolve);
        responseStream.once('error', reject);
      });

      await writeRecruiterReportPdf(report, responseStream);
      await finished;

      const pdf = Buffer.concat(chunks);
      expect(responseStream.status).toHaveBeenCalledWith(200);
      expect(responseStream.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(responseStream.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="MAVI-Linking-Recruiter-AI-Report.pdf"');
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
      expect(pdf.length).toBeGreaterThan(1000);
    });
  });
});
