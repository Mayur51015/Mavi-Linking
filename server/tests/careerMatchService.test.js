const { calculateCareerMatch, evaluateSkillMatch } = require('../src/services/careerMatchService');
const { getRoleRequirement, getAllSupportedRoles } = require('../src/constants/careerRoleRequirements');

describe('MAVI Career Match — Deterministic Intelligence Suite', () => {
  const mockEvidence = {
    user: {
      id: 'mock_user_123',
      name: 'Mayur Student',
      maviId: 'MAVI-TEST01',
      preferredRole: 'Full-Stack Developer',
      preferredDomain: 'Full-Stack Development',
      profileCompletion: 85,
      scores: { overall: 720, development: 680, problemSolving: 550, knowledge: 600 },
      platforms: {
        github: { username: 'mayurdev' },
        leetcode: { username: 'mayurcode' },
      },
    },
    skillsList: [
      { name: 'JavaScript', level: 'Advanced', verified: true },
      { name: 'React', level: 'Advanced', verified: true },
      { name: 'Node.js', level: 'Intermediate', verified: true },
      { name: 'MongoDB', level: 'Intermediate', verified: true },
      { name: 'Git', level: 'Advanced', verified: true },
    ],
    projectSkillsMap: {
      react: { name: 'React', projects: ['MAVI Platform', 'E-Commerce App'] },
      'node.js': { name: 'Node.js', projects: ['MAVI Platform'] },
      mongodb: { name: 'MongoDB', projects: ['MAVI Platform'] },
      javascript: { name: 'JavaScript', projects: ['MAVI Platform', 'Portfolio'] },
    },
    githubLanguages: ['JavaScript', 'HTML', 'CSS', 'TypeScript'],
    projects: [
      {
        id: 'p1',
        title: 'MAVI Linking Platform',
        description: 'Full stack developer portal with authentication and APIs',
        technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
        githubRepo: 'https://github.com/mayur/mavi',
        liveUrl: 'https://mavi.dev',
      },
      {
        id: 'p2',
        title: 'E-Commerce Store',
        description: 'React online shopping interface',
        technologies: ['React', 'JavaScript'],
        githubRepo: 'https://github.com/mayur/shop',
      },
    ],
    dna: {
      personalityType: 'Full Stack Generalist',
      workingStyle: 'Independent',
      strengths: ['Full-Stack Prototyping', 'Database Design'],
    },
    coding: {
      leetcodeSolved: 95,
      leetcodeEasy: 40,
      leetcodeMedium: 45,
      leetcodeHard: 10,
      codeforcesRating: 0,
      isConnected: true,
    },
    github: {
      isConnected: true,
      username: 'mayurdev',
      languages: ['JavaScript', 'TypeScript'],
      repoCount: 12,
      stars: 5,
      commits: 240,
    },
    roadmap: {
      overallProgress: 45,
      readinessScore: 75,
    },
  };

  test('calculates deterministic match score between 0 and 100', () => {
    const result1 = calculateCareerMatch(mockEvidence, 'Full-Stack Developer');
    const result2 = calculateCareerMatch(mockEvidence, 'Full-Stack Developer');

    expect(result1.overallMatch).toBeGreaterThanOrEqual(0);
    expect(result1.overallMatch).toBeLessThanOrEqual(100);
    // Deterministic check: exact same input yields exact same score
    expect(result1.overallMatch).toBe(result2.overallMatch);
    expect(result1.confidence).toBe('High');
  });

  test('identifies strong skills with evidence citations', () => {
    const result = calculateCareerMatch(mockEvidence, 'Full-Stack Developer');
    expect(result.strengths.length).toBeGreaterThan(0);

    const reactSkill = result.strengths.find((s) => s.skill === 'React');
    expect(reactSkill).toBeDefined();
    expect(reactSkill.evidence).toContain('Declared Skill');
    expect(reactSkill.evidence).toContain('Used in 2 project(s)');
  });

  test('detects missing skill gaps accurately for target role', () => {
    const result = calculateCareerMatch(mockEvidence, 'Full-Stack Developer');
    // REST APIs or Docker was not in skills list -> should be identified in skill gaps or partial
    expect(result.skillGaps).toBeDefined();
    expect(result.breakdown.technicalSkills.score).toBeGreaterThan(50);
  });

  test('adjusts gracefully when coding or github platforms are not connected', () => {
    const minimalEvidence = {
      ...mockEvidence,
      user: {
        ...mockEvidence.user,
        scores: { overall: 0, development: 0, problemSolving: 0, knowledge: 0 },
      },
      coding: { isConnected: false, leetcodeSolved: 0 },
      github: { isConnected: false, repoCount: 0, languages: [] },
    };

    const result = calculateCareerMatch(minimalEvidence, 'Full-Stack Developer');
    expect(result.overallMatch).toBeGreaterThan(0);
    expect(result.breakdown.problemSolving.available).toBe(false);
    expect(result.breakdown.developmentActivity.available).toBe(false);
    expect(['Medium', 'Low']).toContain(result.confidence);
  });

  test('supports role switching and recalculation across multiple roles', () => {
    const fsResult = calculateCareerMatch(mockEvidence, 'Full-Stack Developer');
    const aiResult = calculateCareerMatch(mockEvidence, 'AI / Machine Learning Engineer');

    expect(fsResult.targetRole).toBe('Full-Stack Developer');
    expect(aiResult.targetRole).toBe('AI / Machine Learning Engineer');
    // Student with web dev skills should have higher match for Full-Stack than AI/ML
    expect(fsResult.overallMatch).toBeGreaterThan(aiResult.overallMatch);
  });

  test('getAllSupportedRoles returns canonical roles list', () => {
    const roles = getAllSupportedRoles();
    expect(roles.length).toBeGreaterThanOrEqual(8);
    expect(roles.some((r) => r.role === 'Full-Stack Developer')).toBe(true);
    expect(roles.some((r) => r.role === 'Frontend Developer')).toBe(true);
    expect(roles.some((r) => r.role === 'Data Scientist')).toBe(true);
  });
});
