const { simulateScenario, compareAllRoles } = require('../src/services/careerLabService');
const { calculateCareerMatch } = require('../src/services/careerMatchService');

// Mock buildStudentEvidence
jest.mock('../src/services/careerMatchService', () => {
  const originalModule = jest.requireActual('../src/services/careerMatchService');
  return {
    ...originalModule,
    buildStudentEvidence: jest.fn().mockImplementation(async (userId) => ({
      user: {
        id: userId || 'mock_user_123',
        name: 'Mayur Student',
        maviId: 'MAVI-TEST01',
        preferredRole: 'Full-Stack Developer',
        preferredDomain: 'Full-Stack Development',
        profileCompletion: 85,
        scores: { overall: 720, development: 650, problemSolving: 500, knowledge: 600 },
        platforms: { github: { username: 'mayurdev' } },
      },
      skillsList: [
        { name: 'JavaScript', level: 'Advanced', verified: true },
        { name: 'React', level: 'Advanced', verified: true },
        { name: 'Node.js', level: 'Intermediate', verified: true },
      ],
      projectSkillsMap: {
        react: { name: 'React', projects: ['MAVI Platform'] },
        'node.js': { name: 'Node.js', projects: ['MAVI Platform'] },
        javascript: { name: 'JavaScript', projects: ['MAVI Platform'] },
      },
      githubLanguages: ['JavaScript', 'HTML', 'CSS'],
      projects: [
        {
          id: 'p1',
          title: 'MAVI Platform',
          description: 'Full stack developer portal with authentication and APIs',
          technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
          githubRepo: 'https://github.com/mayur/mavi',
          liveUrl: 'https://mavi.dev',
        },
      ],
      dna: { personalityType: 'Full Stack Generalist', strengths: ['Full-Stack Prototyping'] },
      coding: { isConnected: true, leetcodeSolved: 35, leetcodeMedium: 15 },
      github: { isConnected: true, username: 'mayurdev', repoCount: 5, languages: ['JavaScript'] },
      roadmap: { overallProgress: 35, readinessScore: 70 },
    })),
  };
});

describe('MAVI Career Lab — What-If Simulator Suite', () => {
  test('CASE 1: Simulating zero changes returns current score with 0 estimated impact', async () => {
    const result = await simulateScenario('mock_user_123', 'Full-Stack Developer', {});
    expect(result.success).toBe(true);
    expect(result.data.currentMatch).toBe(result.data.simulatedMatch);
    expect(result.data.estimatedImpact).toBe(0);
    expect(result.data.scoringVersion).toBe('1.0');
  });

  test('CASE 2: Simulating missing core skills increases simulated match and computes positive impact', async () => {
    const result = await simulateScenario('mock_user_123', 'Full-Stack Developer', {
      skills: ['Docker', 'TypeScript', 'MongoDB'],
    });

    expect(result.success).toBe(true);
    expect(result.data.simulatedMatch).toBeGreaterThan(result.data.currentMatch);
    expect(result.data.estimatedImpact).toBeGreaterThan(0);
    expect(result.data.categoryImpact.technicalSkills.delta).toBeGreaterThan(0);
    expect(result.data.highestImpactAction.impact).toBeGreaterThan(0);
  });

  test('CASE 3: Multi-action scenario (Skills + Project + Coding) calculates combined impact', async () => {
    const result = await simulateScenario('mock_user_123', 'Full-Stack Developer', {
      skills: ['Docker', 'Automated Testing'],
      projects: [
        {
          title: 'Production Microservices App',
          category: 'production_project',
          technologies: ['Docker', 'AWS', 'Node.js', 'PostgreSQL'],
        },
      ],
      coding: { additionalSolved: 40 },
    });

    expect(result.data.simulatedMatch).toBeGreaterThan(result.data.currentMatch + 5);
    expect(result.data.categoryImpact.projects.delta).toBeGreaterThanOrEqual(0);
    expect(result.data.categoryImpact.problemSolving.delta).toBeGreaterThanOrEqual(0);
  });

  test('CASE 4: Compares current profile match across all canonical roles', async () => {
    const result = await compareAllRoles('mock_user_123');
    expect(result.success).toBe(true);
    expect(result.data.length).toBeGreaterThanOrEqual(8);
    // Verified sorted descending
    for (let i = 1; i < result.data.length; i++) {
      expect(result.data[i - 1].matchScore).toBeGreaterThanOrEqual(result.data[i].matchScore);
    }
  });
});
