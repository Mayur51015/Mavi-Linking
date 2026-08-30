/**
 * MAVI Career Match — Role Requirements Configuration
 *
 * Defines structured technical criteria, required skills, preferred skills,
 * project indicators, and problem-solving thresholds for canonical career roles.
 */

const ROLE_REQUIREMENTS = {
  'Full-Stack Developer': {
    title: 'Full-Stack Developer',
    domain: 'Full-Stack Development',
    category: 'Software Development',
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'REST APIs', 'MongoDB', 'Git'],
    preferredSkills: ['TypeScript', 'Express', 'SQL', 'Docker', 'Next.js', 'TailwindCSS', 'Redux', 'Redis'],
    technicalAreas: ['Frontend', 'Backend', 'Databases', 'API Design', 'Version Control'],
    projectThreshold: 2,
    projectKeywords: ['fullstack', 'full-stack', 'api', 'dashboard', 'crud', 'web app', 'portal', 'platform'],
    psBenchmark: 60,
    devBenchmark: 400,
    dnaArchetypes: ['Full Stack Generalist', 'Project Builder', 'Product Builder'],
    recommendedActions: [
      'Build and deploy a full-stack CRUD application with authentication and persistent database.',
      'Containerize your full-stack project using Docker and configure environment variables.',
      'Add comprehensive automated API tests with Jest or Supertest.',
      'Implement state management and responsive UI design across desktop and mobile.',
    ],
  },

  'Frontend Developer': {
    title: 'Frontend Developer',
    domain: 'Frontend Development',
    category: 'Software Development',
    requiredSkills: ['JavaScript', 'HTML5', 'CSS3', 'React', 'Git', 'Responsive Design'],
    preferredSkills: ['TypeScript', 'Next.js', 'TailwindCSS', 'Redux', 'Vue.js', 'Vite', 'Framer Motion', 'Web Accessibility'],
    technicalAreas: ['UI Architecture', 'State Management', 'CSS/Styling', 'Web Performance', 'DOM & APIs'],
    projectThreshold: 2,
    projectKeywords: ['frontend', 'ui', 'interface', 'landing page', 'spa', 'react', 'design system'],
    psBenchmark: 40,
    devBenchmark: 380,
    dnaArchetypes: ['Product Builder', 'Project Builder', 'Full Stack Generalist'],
    recommendedActions: [
      'Build a complex interactive web application demonstrating state management and API integration.',
      'Implement modern CSS animations, micro-interactions, and dark/light theme switching.',
      'Improve lighthouse accessibility, SEO, and Core Web Vitals across your frontend projects.',
      'Migrate a JavaScript project to TypeScript with strict type definitions.',
    ],
  },

  'Backend Developer': {
    title: 'Backend Developer',
    domain: 'Backend Development',
    category: 'Software Development',
    requiredSkills: ['Node.js', 'Express', 'SQL', 'MongoDB', 'REST APIs', 'Git', 'Authentication'],
    preferredSkills: ['Python', 'PostgreSQL', 'Docker', 'Redis', 'Microservices', 'GraphQL', 'AWS', 'Security / JWT'],
    technicalAreas: ['Server Architecture', 'Database Optimization', 'Security', 'Caching', 'Message Queues'],
    projectThreshold: 2,
    projectKeywords: ['backend', 'server', 'api', 'microservice', 'database', 'rest', 'auth', 'endpoint'],
    psBenchmark: 80,
    devBenchmark: 420,
    dnaArchetypes: ['Scale Architect', 'Problem Solver', 'Performance Optimizer'],
    recommendedActions: [
      'Architect a REST or GraphQL backend with role-based access control (RBAC) and JWT authentication.',
      'Integrate Redis caching to optimize high-throughput database queries.',
      'Implement database schema indexing, aggregation pipelines, and transaction safety.',
      'Deploy backend microservices with Docker containerization and health checks.',
    ],
  },

  'Software Engineer': {
    title: 'Software Engineer',
    domain: 'Software Development',
    category: 'Software Development',
    requiredSkills: ['Data Structures', 'Algorithms', 'Java', 'Python', 'Git', 'System Design', 'OOP'],
    preferredSkills: ['C++', 'SQL', 'Docker', 'Linux', 'Unit Testing', 'CI/CD', 'Design Patterns'],
    technicalAreas: ['Algorithms', 'Object-Oriented Design', 'Operating Systems', 'System Design'],
    projectThreshold: 2,
    projectKeywords: ['algorithm', 'system', 'engine', 'tool', 'service', 'compiler', 'cli'],
    psBenchmark: 120,
    devBenchmark: 450,
    dnaArchetypes: ['Problem Solver', 'Scale Architect', 'Performance Optimizer'],
    recommendedActions: [
      'Practice medium and hard algorithmic problem-solving on LeetCode/Codeforces.',
      'Apply clean architecture and SOLID design patterns to an extensible software service.',
      'Write modular unit test suites achieving over 80% code coverage.',
      'Design and document scalable system architecture blueprints.',
    ],
  },

  'AI / Machine Learning Engineer': {
    title: 'AI / Machine Learning Engineer',
    domain: 'AI / Machine Learning',
    category: 'AI & Data',
    requiredSkills: ['Python', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'NumPy', 'Pandas', 'Git'],
    preferredSkills: ['LLMs', 'Prompt Engineering', 'LangChain', 'FastAPI', 'Docker', 'Hugging Face', 'Data Visualization', 'SQL'],
    technicalAreas: ['Deep Learning', 'Data Preprocessing', 'Model Training', 'MLOps', 'GenAI / LLMs'],
    projectThreshold: 2,
    projectKeywords: ['machine learning', 'ai', 'deep learning', 'model', 'nlp', 'computer vision', 'neural', 'classification'],
    psBenchmark: 70,
    devBenchmark: 380,
    dnaArchetypes: ['Research Engineer', 'Innovation Catalyst', 'Problem Solver'],
    recommendedActions: [
      'Train, fine-tune, and evaluate a neural network or LLM on a domain-specific dataset.',
      'Deploy a machine learning model behind a high-performance FastAPI endpoint with Docker.',
      'Implement data preprocessing, feature engineering, and cross-validation pipelines.',
      'Build an end-to-end GenAI application leveraging RAG (Retrieval-Augmented Generation).',
    ],
  },

  'Data Scientist': {
    title: 'Data Scientist',
    domain: 'Data Science & Analytics',
    category: 'AI & Data',
    requiredSkills: ['Python', 'SQL', 'Pandas', 'NumPy', 'Data Visualization', 'Statistical Analysis', 'Machine Learning'],
    preferredSkills: ['Scikit-Learn', 'Matplotlib', 'Seaborn', 'PowerBI', 'Tableau', 'R', 'BigQuery', 'Jupyter'],
    technicalAreas: ['Exploratory Data Analysis', 'Statistical Inference', 'Predictive Modeling', 'Data Storytelling'],
    projectThreshold: 2,
    projectKeywords: ['data science', 'analysis', 'dataset', 'visualization', 'eda', 'insights', 'prediction', 'analytics'],
    psBenchmark: 50,
    devBenchmark: 350,
    dnaArchetypes: ['Research Engineer', 'Problem Solver', 'Product Builder'],
    recommendedActions: [
      'Perform exploratory data analysis on a real-world dataset and produce actionable visual insights.',
      'Build statistical hypothesis tests and predictive regression/classification models.',
      'Create interactive data storytelling dashboards in Streamlit or PowerBI.',
      'Write optimized SQL aggregation queries for complex relational datasets.',
    ],
  },

  'DevOps Engineer': {
    title: 'DevOps Engineer',
    domain: 'Cloud & DevOps',
    category: 'Infrastructure',
    requiredSkills: ['Linux', 'Docker', 'CI/CD', 'Git', 'Bash / Shell', 'Cloud Platforms (AWS/GCP/Azure)'],
    preferredSkills: ['Kubernetes', 'Terraform', 'GitHub Actions', 'Prometheus', 'Grafana', 'Nginx', 'Security'],
    technicalAreas: ['Continuous Integration', 'Infrastructure as Code', 'Container Orchestration', 'Monitoring'],
    projectThreshold: 1,
    projectKeywords: ['devops', 'docker', 'ci/cd', 'pipeline', 'infrastructure', 'cloud', 'deployment', 'kubernetes'],
    psBenchmark: 40,
    devBenchmark: 420,
    dnaArchetypes: ['DevOps Engineer', 'Scale Architect', 'Performance Optimizer'],
    recommendedActions: [
      'Build an automated CI/CD deployment pipeline with GitHub Actions.',
      'Containerize multi-service applications using Docker Compose and Kubernetes manifests.',
      'Provision cloud infrastructure declaratively using Terraform or CloudFormation.',
      'Set up system telemetry, health checks, and alerting with Prometheus & Grafana.',
    ],
  },

  'Cybersecurity Analyst': {
    title: 'Cybersecurity Analyst',
    domain: 'Cybersecurity',
    category: 'Security',
    requiredSkills: ['Network Security', 'Linux', 'Vulnerability Assessment', 'Cryptography Basics', 'Web Security (OWASP)', 'Git'],
    preferredSkills: ['Python', 'Wireshark', 'Burp Suite', 'Security Auditing', 'IAM & Authentication', 'Penetration Testing'],
    technicalAreas: ['Threat Modeling', 'Web App Penetration', 'Defensive Security', 'Network Protocols'],
    projectThreshold: 1,
    projectKeywords: ['security', 'cybersecurity', 'vulnerability', 'audit', 'owasp', 'encryption', 'auth', 'firewall'],
    psBenchmark: 50,
    devBenchmark: 350,
    dnaArchetypes: ['Problem Solver', 'Performance Optimizer', 'Research Engineer'],
    recommendedActions: [
      'Conduct an OWASP Top 10 vulnerability assessment on a live web application.',
      'Implement robust authentication, JWT revocation, rate limiting, and CSRF protection.',
      'Perform network packet analysis using Wireshark and write security diagnostic reports.',
      'Earn recognized security certifications (CompTIA Security+, CEH).',
    ],
  },

  'Mobile App Developer': {
    title: 'Mobile App Developer',
    domain: 'Mobile App Development',
    category: 'Software Development',
    requiredSkills: ['React Native / Flutter / Kotlin / Swift', 'JavaScript / Dart', 'Mobile UI Design', 'REST APIs', 'Git'],
    preferredSkills: ['TypeScript', 'Firebase', 'State Management', 'Offline Storage', 'App Store / Play Store Deployment'],
    technicalAreas: ['Mobile UI/UX', 'Native Device APIs', 'Offline Synchronization', 'Mobile Performance'],
    projectThreshold: 1,
    projectKeywords: ['mobile', 'app', 'android', 'ios', 'react native', 'flutter', 'smartphone'],
    psBenchmark: 40,
    devBenchmark: 380,
    dnaArchetypes: ['Product Builder', 'Project Builder', 'Full Stack Generalist'],
    recommendedActions: [
      'Build and publish a cross-platform mobile application with offline storage and push notifications.',
      'Integrate device native capabilities (Camera, Geolocation, Biometrics).',
      'Optimize mobile rendering performance and network payload caching.',
    ],
  },
};

/**
 * Get requirement definition for a role, with fuzzy fallback matching
 */
function getRoleRequirement(targetRole) {
  if (!targetRole || typeof targetRole !== 'string') {
    return ROLE_REQUIREMENTS['Full-Stack Developer'];
  }

  const trimmed = targetRole.trim();
  if (ROLE_REQUIREMENTS[trimmed]) {
    return ROLE_REQUIREMENTS[trimmed];
  }

  const lower = trimmed.toLowerCase();
  for (const [key, req] of Object.entries(ROLE_REQUIREMENTS)) {
    if (key.toLowerCase() === lower || req.domain.toLowerCase() === lower) {
      return req;
    }
  }

  // Substring matching
  for (const [key, req] of Object.entries(ROLE_REQUIREMENTS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return req;
    }
  }

  // Fallback to Full-Stack Developer
  return ROLE_REQUIREMENTS['Full-Stack Developer'];
}

/**
 * Get list of all supported target roles
 */
function getAllSupportedRoles() {
  return Object.keys(ROLE_REQUIREMENTS).map((roleKey) => {
    const r = ROLE_REQUIREMENTS[roleKey];
    return {
      role: r.title,
      domain: r.domain,
      category: r.category,
      requiredSkillsCount: r.requiredSkills.length,
      preferredSkillsCount: r.preferredSkills.length,
    };
  });
}

module.exports = {
  ROLE_REQUIREMENTS,
  getRoleRequirement,
  getAllSupportedRoles,
};
