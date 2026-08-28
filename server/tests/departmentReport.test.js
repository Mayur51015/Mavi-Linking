const mongoose = require('mongoose');
const { generateDepartmentReportData, writeDepartmentReportPdf } = require('../src/services/departmentReportService');
const User = require('../src/models/User');
const Department = require('../src/models/Department');

describe('Department Report Service & PDF Generation', () => {
  const mockDeptId = new mongoose.Types.ObjectId();
  const mockInstId = new mongoose.Types.ObjectId();

  const mockDeptAdminReq = {
    user: {
      _id: new mongoose.Types.ObjectId(),
      name: 'Dr. Alan Turing',
      email: 'alan.turing@zeal.edu',
      role: 'department_admin',
      departmentId: mockDeptId,
      institutionId: mockInstId,
      university: {
        name: 'Zeal Institute of Technology',
        department: 'Computer Engineering',
      },
    },
    departmentScope: {
      departmentId: mockDeptId,
      institutionId: mockInstId,
    },
  };

  const mockStudents = [
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Ada Lovelace',
      email: 'ada@zeal.edu',
      maviId: 'MAVI-ADA12345',
      prn: 'PRN2026001',
      status: 'active',
      accountStatus: 'ACTIVE',
      isVerified: true,
      scores: {
        development: 850,
        problemSolving: 900,
        knowledge: 820,
        overall: 870,
      },
      skillsList: [{ name: 'React' }, { name: 'Node.js' }, { name: 'Python' }],
      platforms: {
        github: { username: 'adalovelace' },
        leetcode: { username: 'ada_lc' },
      },
      placementStatus: 'Placed / Hired',
      placementReadinessScore: 92,
      profileCompletion: 95,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Grace Hopper',
      email: 'grace@zeal.edu',
      maviId: 'MAVI-GRACE678',
      prn: 'PRN2026002',
      status: 'active',
      accountStatus: 'ACTIVE',
      isVerified: true,
      scores: {
        development: 780,
        problemSolving: 750,
        knowledge: 800,
        overall: 775,
      },
      skillsList: [{ name: 'C++' }, { name: 'Python' }, { name: 'Data Structures' }],
      platforms: {
        github: { username: 'gracehopper' },
        leetcode: { username: 'grace_lc' },
      },
      placementStatus: 'Available for Hiring',
      placementReadinessScore: 85,
      profileCompletion: 90,
    },
  ];

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateDepartmentReportData', () => {
    it('generates normalized department report data for scoped students', async () => {
      jest.spyOn(Department, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: mockDeptId,
          name: 'Computer Engineering',
          code: 'COMP',
          institutionId: {
            _id: mockInstId,
            name: 'Zeal Institute of Technology',
          },
        }),
      });

      jest.spyOn(User, 'find').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockStudents),
      });

      const reportData = await generateDepartmentReportData(mockDeptAdminReq);

      expect(reportData).toBeDefined();
      expect(reportData.institutionName).toBe('Zeal Institute of Technology');
      expect(reportData.departmentName).toBe('Computer Engineering');
      expect(reportData.totalRecords).toBe(2);
      expect(reportData.reportType).toBe('DEPARTMENT_STUDENT_PERFORMANCE');
      expect(reportData.generatedAt).toBeDefined();

      // Summary checks
      expect(reportData.summary.totalStudents).toBe(2);
      expect(reportData.summary.activeStudents).toBe(2);
      expect(reportData.summary.verifiedStudents).toBe(2);
      expect(reportData.summary.averageScores.overall).toBe(Math.round((870 + 775) / 2));
      expect(reportData.summary.averageScores.development).toBe(Math.round((850 + 780) / 2));
      expect(reportData.summary.averageScores.problemSolving).toBe(Math.round((900 + 750) / 2));
      expect(reportData.summary.platformStats.githubLinked).toBe(2);
      expect(reportData.summary.platformStats.leetcodeLinked).toBe(2);

      // Student checks
      expect(reportData.students).toHaveLength(2);
      expect(reportData.students[0].name).toBe('Ada Lovelace');
      expect(reportData.students[0].maviId).toBe('MAVI-ADA12345');
      expect(reportData.students[0].rank).toBe(1);
      expect(reportData.students[0].scores.overall).toBe(870);
      expect(reportData.students[1].name).toBe('Grace Hopper');
      expect(reportData.students[1].rank).toBe(2);
    });

    it('handles empty department records gracefully (0 students)', async () => {
      jest.spyOn(Department, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: mockDeptId,
          name: 'Information Technology',
          code: 'IT',
          institutionId: {
            _id: mockInstId,
            name: 'Zeal Institute of Technology',
          },
        }),
      });

      jest.spyOn(User, 'find').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const reportData = await generateDepartmentReportData(mockDeptAdminReq);

      expect(reportData.totalRecords).toBe(0);
      expect(reportData.summary.totalStudents).toBe(0);
      expect(reportData.summary.averageScores.overall).toBe(0);
      expect(reportData.students).toEqual([]);
    });
  });

  describe('writeDepartmentReportPdf', () => {
    it('sets correct response headers and streams PDF binary data', async () => {
      const reportData = {
        institutionName: 'Zeal Institute of Technology',
        departmentName: 'Computer Engineering',
        departmentCode: 'COMP',
        generatedAt: new Date().toISOString(),
        totalRecords: 2,
        reportType: 'DEPARTMENT_STUDENT_PERFORMANCE',
        summary: {
          totalStudents: 2,
          activeStudents: 2,
          verifiedStudents: 2,
          averageScores: {
            overall: 823,
            development: 815,
            problemSolving: 825,
            knowledge: 810,
          },
          tierDistribution: { Elite: 1, Gold: 1 },
          topSkills: [{ name: 'React', count: 1 }],
        },
        students: [
          {
            rank: 1,
            id: mockStudents[0]._id,
            name: 'Ada Lovelace',
            email: 'ada@zeal.edu',
            maviId: 'MAVI-ADA12345',
            prn: 'PRN2026001',
            status: 'active',
            accountStatus: 'ACTIVE',
            isVerified: true,
            scores: { development: 850, problemSolving: 900, knowledge: 820, overall: 870 },
            tier: 'Elite Developer',
          },
          {
            rank: 2,
            id: mockStudents[1]._id,
            name: 'Grace Hopper',
            email: 'grace@zeal.edu',
            maviId: 'MAVI-GRACE678',
            prn: 'PRN2026002',
            status: 'active',
            accountStatus: 'ACTIVE',
            isVerified: true,
            scores: { development: 780, problemSolving: 750, knowledge: 800, overall: 775 },
            tier: 'Gold',
          },
        ],
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
      };

      await writeDepartmentReportPdf(reportData, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/^attachment; filename="MAVI_Department_Performance_Report_Computer_Engineering_\d{4}-\d{2}-\d{2}\.pdf"$/)
      );
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    });

    it('generates valid PDF when records count is 0 (empty state)', async () => {
      const emptyReportData = {
        institutionName: 'Zeal Institute of Technology',
        departmentName: 'Civil Engineering',
        departmentCode: 'CIVIL',
        generatedAt: new Date().toISOString(),
        totalRecords: 0,
        reportType: 'DEPARTMENT_STUDENT_PERFORMANCE',
        summary: {
          totalStudents: 0,
          activeStudents: 0,
          verifiedStudents: 0,
          averageScores: { overall: 0, development: 0, problemSolving: 0, knowledge: 0 },
          tierDistribution: {},
          topSkills: [],
        },
        students: [],
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
      };

      await writeDepartmentReportPdf(emptyReportData, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/^attachment; filename="MAVI_Department_Performance_Report_Civil_Engineering_\d{4}-\d{2}-\d{2}\.pdf"$/)
      );
    });

    it('handles large multi-page student lists with pagination', async () => {
      const manyStudents = Array.from({ length: 45 }, (_, i) => ({
        rank: i + 1,
        id: new mongoose.Types.ObjectId(),
        name: `Student Long Name Number ${i + 1}`,
        email: `student_${i + 1}_long_email@zeal.edu`,
        maviId: `MAVI-ID-${1000 + i}`,
        prn: `PRN-2026-${1000 + i}`,
        status: i % 5 === 0 ? 'inactive' : 'active',
        accountStatus: 'ACTIVE',
        isVerified: true,
        scores: {
          development: 500 + (i * 10),
          problemSolving: 520 + (i * 8),
          knowledge: 510 + (i * 9),
          overall: 510 + (i * 9),
        },
        tier: 'Intermediate',
      }));

      const largeReportData = {
        institutionName: 'Zeal Institute of Technology',
        departmentName: 'Computer Engineering',
        departmentCode: 'COMP',
        generatedAt: new Date().toISOString(),
        totalRecords: manyStudents.length,
        reportType: 'DEPARTMENT_STUDENT_PERFORMANCE',
        summary: {
          totalStudents: manyStudents.length,
          activeStudents: 36,
          verifiedStudents: 45,
          averageScores: { overall: 700, development: 700, problemSolving: 700, knowledge: 700 },
          tierDistribution: { Intermediate: 45 },
          topSkills: [{ name: 'JavaScript', count: 40 }],
        },
        students: manyStudents,
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
      };

      await expect(writeDepartmentReportPdf(largeReportData, res)).resolves.not.toThrow();
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    });
  });
});
