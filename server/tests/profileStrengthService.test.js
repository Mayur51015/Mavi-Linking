const { calculateProfileStrength } = require('../src/services/profileStrengthService');

describe('Unified Profile Strength Service Suite', () => {
  const completeUser = {
    name: 'Mayur Student',
    bio: 'Passionate full-stack developer and open source enthusiast.',
    avatar: 'https://cloudinary.com/avatar.png',
    preferredRole: 'Full-Stack Developer',
    preferredDomain: 'Full-Stack Development',
    skillsList: [
      { name: 'JavaScript' },
      { name: 'React' },
      { name: 'Node.js' },
    ],
    portfolioDocs: [
      { category: 'Resume', title: 'Mayur_Resume.pdf', fileUrl: 'https://mavi.dev/resume.pdf' },
    ],
    university: {
      name: 'Zeal College of Engineering and Research',
      department: 'Computer Engineering',
    },
    platforms: {
      github: { username: 'mayurdev' },
      leetcode: { username: 'mayurcode' },
    },
  };

  const completeProjects = [
    {
      title: 'MAVI Linking Platform',
      description: 'Comprehensive student developer identity and verification platform.',
      technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
      githubRepo: 'https://github.com/mayur/mavi',
      liveUrl: 'https://mavi.dev',
    },
    {
      title: 'E-Commerce Marketplace',
      description: 'Full featured shopping cart with checkout and payment gateway.',
      technologies: ['React', 'JavaScript'],
    },
  ];

  test('CASE 1: Fully completed profile scores 100% with no missing items', () => {
    const result = calculateProfileStrength(completeUser, completeProjects);
    expect(result.profileStrength).toBe(100);
    expect(result.missingProfileItems).toEqual([]);
    expect(result.breakdown.identity).toBe(15);
    expect(result.breakdown.skills).toBe(25);
    expect(result.breakdown.projects).toBe(25);
    expect(result.breakdown.resume).toBe(15);
    expect(result.breakdown.academic).toBe(10);
    expect(result.breakdown.platforms).toBe(10);
  });

  test('CASE 2: Detects skills across multiple fields and project technologies', () => {
    const userWithProjectSkillsOnly = {
      ...completeUser,
      skillsList: [],
      skills: [],
    };
    // Skills are present in project technologies ('React', 'Node.js', 'MongoDB', 'Express') -> >= 3
    const result = calculateProfileStrength(userWithProjectSkillsOnly, completeProjects);
    expect(result.breakdown.skills).toBe(25);
    expect(result.missingProfileItems).not.toContain('Technical Skills');
  });

  test('CASE 3: Missing technical skills reduces score appropriately', () => {
    const userNoSkills = {
      ...completeUser,
      skillsList: [],
    };
    const projectsNoTech = [
      { title: 'Project 1', description: 'Simple project with no tags', technologies: [] },
      { title: 'Project 2', description: 'Another project with no tags', technologies: [] },
    ];

    const result = calculateProfileStrength(userNoSkills, projectsNoTech);
    expect(result.breakdown.skills).toBe(0);
    expect(result.profileStrength).toBe(75);
    expect(result.missingProfileItems).toContain('Technical Skills');
  });

  test('CASE 4: Missing projects reduces score appropriately', () => {
    const result = calculateProfileStrength(completeUser, []);
    expect(result.breakdown.projects).toBe(0);
    expect(result.profileStrength).toBe(75);
    expect(result.missingProfileItems).toContain('Projects');
  });

  test('CASE 5: Single detailed project receives full project credit', () => {
    const singleDetailedProject = [completeProjects[0]];
    const result = calculateProfileStrength(completeUser, singleDetailedProject);
    expect(result.breakdown.projects).toBe(25);
    expect(result.profileStrength).toBe(100);
    expect(result.missingProfileItems).toEqual([]);
  });

  test('CASE 6: Missing resume reduces score by 15 pts', () => {
    const userNoResume = {
      ...completeUser,
      portfolioDocs: [],
      documents: {},
    };
    const result = calculateProfileStrength(userNoResume, completeProjects);
    expect(result.breakdown.resume).toBe(0);
    expect(result.profileStrength).toBe(85);
    expect(result.missingProfileItems).toContain('Resume');
  });

  test('CASE 7: Missing academic information reduces score by 10 pts', () => {
    const userNoCollege = {
      ...completeUser,
      university: {},
      collegeName: '',
      institutionId: null,
      degree: '',
      prn: '',
    };
    const result = calculateProfileStrength(userNoCollege, completeProjects);
    expect(result.breakdown.academic).toBe(0);
    expect(result.profileStrength).toBe(90);
    expect(result.missingProfileItems).toContain('Academic Information');
  });

  test('CASE 8: Handles null, undefined, and empty objects gracefully', () => {
    const result = calculateProfileStrength(null, null);
    expect(result.profileStrength).toBe(0);
    expect(result.missingProfileItems).toBeDefined();

    const emptyUserResult = calculateProfileStrength({}, []);
    expect(emptyUserResult.profileStrength).toBeLessThan(50);
  });
});
