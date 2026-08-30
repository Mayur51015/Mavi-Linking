const { OpenAI } = require('openai');
const User = require('../models/User');
const Project = require('../models/Project');
const CareerRoadmap = require('../models/CareerRoadmap');
const CareerInsight = require('../models/CareerInsight');

/**
 * Calculate Profile Strength and identify missing elements
 */
const calculateProfileStrength = (user, projects = []) => {
  let score = 0;
  const missingItems = [];

  // Skills Check (25 pts)
  const skillsCount = user.skillsList ? user.skillsList.length : 0;
  if (skillsCount >= 5) {
    score += 25;
  } else if (skillsCount >= 2) {
    score += 15;
    missingItems.push('Add more skills (at least 5)');
  } else {
    missingItems.push('Technical Skills');
  }

  // Projects Check (25 pts)
  if (projects.length >= 3) {
    score += 25;
  } else if (projects.length >= 1) {
    score += 15;
    missingItems.push('Add more detailed projects');
  } else {
    missingItems.push('Projects');
  }

  // Resume / Portfolio Docs (20 pts)
  const hasResume = user.portfolioDocs?.some(d => d.category === 'Resume') || user.documents?.resume;
  if (hasResume) {
    score += 20;
  } else {
    missingItems.push('Resume');
  }

  // Developer Platform Connections (15 pts)
  const hasGithub = user.githubUsername || user.platforms?.github?.username || user.platformData?.github;
  const hasLeetcode = user.platforms?.leetcode?.username || user.platformData?.leetcode;
  if (hasGithub) score += 10;
  else missingItems.push('GitHub Profile');

  if (hasLeetcode) score += 5;

  // Academic / Degree Info (15 pts)
  if (user.degree || user.university?.name || user.cgpa) {
    score += 15;
  } else {
    missingItems.push('Academic Information');
  }

  return {
    profileStrength: Math.min(score, 100),
    missingProfileItems: missingItems,
  };
};

/**
 * Infer current skill level based on profile metrics
 */
const inferCurrentLevel = (user, projects = []) => {
  const skillsCount = user.skillsList?.length || 0;
  const projectsCount = projects.length;
  const overallScore = user.scores?.overall || 0;
  const devScore = user.scores?.development || 0;
  const psScore = user.scores?.problemSolving || 0;

  if (projectsCount >= 4 || overallScore >= 650 || (devScore >= 500 && psScore >= 400)) {
    return 'Advanced';
  }
  if (projectsCount >= 2 || skillsCount >= 4 || overallScore >= 350 || devScore >= 250) {
    return 'Intermediate';
  }
  return 'Beginner';
};

/**
 * Intelligent deterministic fallback generator customized to any target role and student profile
 */
const generateDeterministicRoadmap = (user, projects, targetRole, profileStrength, missingProfileItems) => {
  const currentSkills = (user.skillsList || []).map(s => s.name.trim()).filter(Boolean);
  const projectTitles = projects.map(p => p.title);
  const projectTechs = projects.flatMap(p => p.technologies || []);
  const allKnownTech = Array.from(new Set([...currentSkills, ...projectTechs]));
  const currentLevel = inferCurrentLevel(user, projects);

  const roleLower = (targetRole || 'Full-Stack Developer').toLowerCase();

  // Role-specific templates and standard skill expectations
  let roleTech = [];
  let phasesData = [];
  let projectTemplates = [];
  let relatedRoles = [];

  if (roleLower.includes('ai') || roleLower.includes('machine learning') || roleLower.includes('data science') || roleLower.includes('ml')) {
    roleTech = ['Python', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'Pandas', 'NumPy', 'FastAPI', 'MLOps', 'Vector Databases', 'Prompt Engineering'];
    relatedRoles = [
      { role: 'AI/ML Engineer', alignmentScore: 92, matchReason: 'Strong mathematical aptitude & Python ecosystem alignment' },
      { role: 'Data Scientist', alignmentScore: 86, matchReason: 'Statistical modeling & data visualization overlap' },
      { role: 'Backend ML Platform Engineer', alignmentScore: 80, matchReason: 'API deployment & model serving infrastructure' },
      { role: 'Data Analyst', alignmentScore: 75, matchReason: 'Data wrangling and exploratory data analysis' },
    ];
    phasesData = [
      {
        phaseNumber: 1,
        title: 'Phase 1: Mathematics & Python for AI',
        description: 'Master core numerical computing, probability, linear algebra, and data manipulation.',
        estimatedTimeline: 'Month 1',
        items: [
          { id: 'item_1_1', title: 'Python Advanced Concepts & OOP', description: 'Generators, decorators, async execution, memory profiling', status: 'Completed', priority: 'High', resources: ['Python Official Docs', 'Real Python'] },
          { id: 'item_1_2', title: 'NumPy, Pandas & Data Wrangling', description: 'Vectorized operations, data cleaning, feature engineering', status: 'In Progress', priority: 'High', resources: ['10 Minutes to Pandas', 'Kaggle Courses'] },
          { id: 'item_1_3', title: 'Linear Algebra & Statistics Essentials', description: 'Matrix calculus, gradient descent, probability distributions', status: 'Not Started', priority: 'Medium', resources: ['Khan Academy Linear Algebra', 'StatQuest'] },
        ],
      },
      {
        phaseNumber: 2,
        title: 'Phase 2: Machine Learning Foundations',
        description: 'Implement classical ML algorithms, validation pipelines, and performance metrics.',
        estimatedTimeline: 'Month 2',
        items: [
          { id: 'item_2_1', title: 'Supervised & Unsupervised Learning', description: 'Regression, Decision Trees, Ensembles (XGBoost), K-Means', status: 'Not Started', priority: 'High', resources: ['Scikit-Learn Tutorials', 'Coursera ML'] },
          { id: 'item_2_2', title: 'Model Evaluation & Cross-Validation', description: 'ROC-AUC, F1-Score, Hyperparameter tuning with Optuna', status: 'Not Started', priority: 'Medium', resources: ['Scikit-Learn Documentation'] },
        ],
      },
      {
        phaseNumber: 3,
        title: 'Phase 3: Deep Learning & Neural Architectures',
        description: 'Build neural networks, CNNs, Transformers, and PyTorch computation graphs.',
        estimatedTimeline: 'Month 3-4',
        items: [
          { id: 'item_3_1', title: 'PyTorch Deep Learning Core', description: 'Tensors, autograd, custom layers, loss functions', status: 'Not Started', priority: 'High', resources: ['PyTorch Blitz Tutorials'] },
          { id: 'item_3_2', title: 'Transformer Models & LLMs', description: 'Attention mechanisms, fine-tuning HuggingFace models, LoRA', status: 'Not Started', priority: 'High', resources: ['Hugging Face NLP Course'] },
        ],
      },
      {
        phaseNumber: 4,
        title: 'Phase 4: MLOps, API Serving & Vector Databases',
        description: 'Deploy production AI inference APIs with latency guarantees.',
        estimatedTimeline: 'Month 5',
        items: [
          { id: 'item_4_1', title: 'FastAPI Model Serving & Docker', description: 'Build high-performance REST/gRPC endpoints for model inference', status: 'Not Started', priority: 'High', resources: ['FastAPI Guide', 'Docker Documentation'] },
          { id: 'item_4_2', title: 'RAG Pipelines & Vector Search', description: 'LangChain/LlamaIndex with Pinecone, Milvus or pgvector', status: 'Not Started', priority: 'High', resources: ['RAG Production Guide'] },
        ],
      },
      {
        phaseNumber: 5,
        title: 'Phase 5: Advanced AI Projects & Optimization',
        description: 'Quantization, ONNX runtime, streaming responses, and production portfolio projects.',
        estimatedTimeline: 'Month 6',
        items: [
          { id: 'item_5_1', title: 'Model Quantization & Inference Speedup', description: 'vLLM, TensorRT-LLM, ONNX acceleration', status: 'Not Started', priority: 'Medium', resources: ['vLLM Docs'] },
          { id: 'item_5_2', title: 'End-to-End Enterprise AI Capstone', description: 'Multi-modal or autonomous AI agent system deployment', status: 'Not Started', priority: 'High', resources: ['GitHub Best Practices'] },
        ],
      },
    ];
    projectTemplates = [
      {
        id: 'proj_1',
        title: 'Enterprise RAG Knowledge Assistant',
        description: 'Build a production Retrieval-Augmented Generation system over enterprise documentation with hybrid search and latency optimization.',
        skillsPracticed: ['Python', 'FastAPI', 'PyTorch', 'Vector Databases', 'LangChain'],
        difficulty: 'Intermediate',
        expectedOutcome: 'A deployable AI microservice answering complex company domain queries with accurate citations.',
        suggestedTechnologies: ['FastAPI', 'ChromaDB', 'HuggingFace', 'Docker', 'OpenAI/Gemini API'],
      },
      {
        id: 'proj_2',
        title: 'Real-time Predictive Analytics Pipeline',
        description: 'Train and serve a streaming time-series anomaly detection model with real-time dashboards.',
        skillsPracticed: ['Scikit-Learn', 'Pandas', 'FastAPI', 'Kafka / Redis', 'Docker'],
        difficulty: 'Advanced',
        expectedOutcome: 'Interactive monitoring platform showing live inference streaming with sub-50ms latency.',
        suggestedTechnologies: ['Python', 'PyTorch', 'Streamlit / React', 'Redis', 'Docker'],
      },
      {
        id: 'proj_3',
        title: 'Autonomous Code Review AI Agent',
        description: 'Develop an automated agent that analyzes GitHub pull requests, detects code smells, and provides actionable refactor suggestions.',
        skillsPracticed: ['LLM Orchestration', 'Prompt Engineering', 'GitHub API', 'FastAPI'],
        difficulty: 'Intermediate',
        expectedOutcome: 'GitHub webhook service generating automated contextual PR feedback.',
        suggestedTechnologies: ['Python', 'FastAPI', 'GitHub Webhooks', 'Docker'],
      },
    ];
  } else if (roleLower.includes('frontend') || roleLower.includes('ui') || roleLower.includes('react')) {
    roleTech = ['JavaScript (ES6+)', 'TypeScript', 'React.js', 'Next.js', 'Tailwind CSS', 'State Management (Redux/Zustand)', 'Web Performance', 'Testing (Jest/Cypress)'];
    relatedRoles = [
      { role: 'Frontend Engineer', alignmentScore: 94, matchReason: 'Deep UI architecture & modern framework skills' },
      { role: 'Full-Stack Developer', alignmentScore: 85, matchReason: 'High UI proficiency with backend integration potential' },
      { role: 'UI/UX Design Technologist', alignmentScore: 80, matchReason: 'Design systems, accessibility & motion mastery' },
      { role: 'Mobile Developer (React Native)', alignmentScore: 78, matchReason: 'Reusable component paradigm and state architecture' },
    ];
    phasesData = [
      {
        phaseNumber: 1,
        title: 'Phase 1: Modern JavaScript & Core Web APIs',
        description: 'Solidify JavaScript runtime mechanics, asynchronous patterns, and DOM manipulation.',
        estimatedTimeline: 'Month 1',
        items: [
          { id: 'item_1_1', title: 'ES6+, Async/Await & Event Loop', description: 'Closures, prototypes, promises, microtask queue execution', status: 'Completed', priority: 'High', resources: ['MDN JavaScript Guide', 'JavaScript.info'] },
          { id: 'item_1_2', title: 'TypeScript Fundamentals for React', description: 'Generics, utility types, component prop typing, strict mode', status: 'In Progress', priority: 'High', resources: ['TypeScript Handbook'] },
        ],
      },
      {
        phaseNumber: 2,
        title: 'Phase 2: Advanced React & State Management',
        description: 'Master hooks, render lifecycles, memoization, and global state machines.',
        estimatedTimeline: 'Month 2',
        items: [
          { id: 'item_2_1', title: 'React Hooks & Custom Hook Architecture', description: 'useCallback, useMemo, useRef, custom business logic hooks', status: 'In Progress', priority: 'High', resources: ['React 19 Docs'] },
          { id: 'item_2_2', title: 'Global State: Zustand / Redux Toolkit', description: 'Store slices, selectors, async thunks, optimistic UI updates', status: 'Not Started', priority: 'High', resources: ['Zustand Docs'] },
        ],
      },
      {
        phaseNumber: 3,
        title: 'Phase 3: Next.js, SSR & Server Components',
        description: 'Build production full-stack client applications with App Router and streaming SSR.',
        estimatedTimeline: 'Month 3',
        items: [
          { id: 'item_3_1', title: 'Next.js App Router & Server Actions', description: 'Server vs Client components, route handlers, metadata SEO', status: 'Not Started', priority: 'High', resources: ['Next.js Official Learn'] },
          { id: 'item_3_2', title: 'Design Systems & Component Libraries', description: 'Tailwind CSS, Radix UI primitives, design tokens, dark mode', status: 'Not Started', priority: 'Medium', resources: ['Tailwind Docs', 'Radix UI'] },
        ],
      },
      {
        phaseNumber: 4,
        title: 'Phase 4: Web Performance, Testing & Security',
        description: 'Core Web Vitals, code splitting, accessibility (WCAG), and end-to-end testing.',
        estimatedTimeline: 'Month 4-5',
        items: [
          { id: 'item_4_1', title: 'Web Vitals & Performance Optimization', description: 'Lighthouse scoring, lazy loading, bundle analysis, caching', status: 'Not Started', priority: 'High', resources: ['web.dev Metrics'] },
          { id: 'item_4_2', title: 'Testing with Vitest & Playwright', description: 'Component unit tests, integration mocks, end-to-end user flows', status: 'Not Started', priority: 'Medium', resources: ['Playwright Docs'] },
        ],
      },
    ];
    projectTemplates = [
      {
        id: 'proj_1',
        title: 'Collaborative Real-Time Workspace',
        description: 'Create an interactive real-time whiteboard or markdown canvas with multiplayer cursor sync and undo/redo history.',
        skillsPracticed: ['React', 'TypeScript', 'WebSockets', 'Tailwind CSS', 'State Management'],
        difficulty: 'Advanced',
        expectedOutcome: 'Ultra-fast interactive workspace supporting multiple simultaneous collaborators.',
        suggestedTechnologies: ['Next.js', 'TypeScript', 'Socket.io / Liveblocks', 'Tailwind CSS'],
      },
      {
        id: 'proj_2',
        title: 'High-Performance SaaS Analytics Dashboard',
        description: 'Build a responsive SaaS command center with real-time charts, dark mode, keyboard shortcuts, and exportable PDF reports.',
        skillsPracticed: ['React', 'Recharts', 'TypeScript', 'Virtualization', 'Accessibility'],
        difficulty: 'Intermediate',
        expectedOutcome: 'Production-ready dashboard with virtualized tables handling 50k+ rows smoothly.',
        suggestedTechnologies: ['React 19', 'TanStack Table', 'Recharts', 'Tailwind CSS'],
      },
    ];
  } else if (roleLower.includes('devops') || roleLower.includes('cloud') || roleLower.includes('infrastructure')) {
    roleTech = ['Linux', 'Docker', 'Kubernetes', 'CI/CD (GitHub Actions)', 'Terraform (IaC)', 'AWS / GCP', 'Prometheus & Grafana', 'Nginx & Networking'];
    relatedRoles = [
      { role: 'DevOps / Platform Engineer', alignmentScore: 91, matchReason: 'Infrastructure automation & container orchestration focus' },
      { role: 'Cloud Solutions Architect', alignmentScore: 84, matchReason: 'Cloud networking, IAM & scalable design knowledge' },
      { role: 'Site Reliability Engineer (SRE)', alignmentScore: 82, matchReason: 'Observability, incident management & SLA monitoring' },
      { role: 'Backend Engineer', alignmentScore: 78, matchReason: 'API gateway & distributed systems integration' },
    ];
    phasesData = [
      {
        phaseNumber: 1,
        title: 'Phase 1: Linux Systems & Networking Fundamentals',
        description: 'Master shell scripting, process management, TCP/IP, DNS, and reverse proxies.',
        estimatedTimeline: 'Month 1',
        items: [
          { id: 'item_1_1', title: 'Linux Administration & Bash Scripting', description: 'Systemd, SSH key management, cron, text manipulation (grep/awk)', status: 'Completed', priority: 'High', resources: ['Linux Journey'] },
          { id: 'item_1_2', title: 'Nginx, DNS & SSL/TLS Configuration', description: 'Reverse proxying, load balancing, Certbot automation', status: 'In Progress', priority: 'High', resources: ['Nginx Beginner Guide'] },
        ],
      },
      {
        phaseNumber: 2,
        title: 'Phase 2: Containerization with Docker',
        description: 'Build secure, multi-stage container images and compose multi-service environments.',
        estimatedTimeline: 'Month 2',
        items: [
          { id: 'item_2_1', title: 'Docker Deep Dive & Multi-Stage Builds', description: 'Layer caching, minimal base images (Alpine/Distroless), non-root users', status: 'In Progress', priority: 'High', resources: ['Docker Deep Dive'] },
          { id: 'item_2_2', title: 'Docker Compose & Networking', description: 'Bridge networks, volumes, secrets, multi-container orchestration', status: 'Not Started', priority: 'High', resources: ['Docker Compose Docs'] },
        ],
      },
      {
        phaseNumber: 3,
        title: 'Phase 3: CI/CD Pipelines & Automation',
        description: 'Automate testing, container building, security scanning, and deployments.',
        estimatedTimeline: 'Month 3',
        items: [
          { id: 'item_3_1', title: 'GitHub Actions CI/CD Mastery', description: 'Reusable workflows, secrets management, automated releases', status: 'Not Started', priority: 'High', resources: ['GitHub Actions Documentation'] },
          { id: 'item_3_2', title: 'Container Security & Vulnerability Scanning', description: 'Trivy, SonarQube, automated SBOM generation', status: 'Not Started', priority: 'Medium', resources: ['Aqua Security Trivy'] },
        ],
      },
      {
        phaseNumber: 4,
        title: 'Phase 4: Kubernetes & Infrastructure as Code',
        description: 'Orchestrate distributed clusters with K8s and manage cloud assets via Terraform.',
        estimatedTimeline: 'Month 4-5',
        items: [
          { id: 'item_4_1', title: 'Kubernetes Architecture & Deployments', description: 'Pods, Services, Ingress, ConfigMaps, Secrets, Horizontal Pod Autoscaling', status: 'Not Started', priority: 'High', resources: ['Kubernetes.io Tutorials'] },
          { id: 'item_4_2', title: 'Terraform IaC on AWS / GCP', description: 'Modules, state locks (S3/DynamoDB), VPCs, managed databases', status: 'Not Started', priority: 'High', resources: ['HashiCorp Learn Terraform'] },
        ],
      },
    ];
    projectTemplates = [
      {
        id: 'proj_1',
        title: 'Multi-Cloud GitOps Deployment Pipeline',
        description: 'Set up an automated GitOps deployment workflow deploying a microservices application to Kubernetes with ArgoCD and GitHub Actions.',
        skillsPracticed: ['Docker', 'Kubernetes', 'GitHub Actions', 'ArgoCD', 'Terraform'],
        difficulty: 'Advanced',
        expectedOutcome: 'Zero-downtime automated deployment cluster with automated rollbacks.',
        suggestedTechnologies: ['Kubernetes', 'ArgoCD', 'Docker', 'AWS EKS / GKE', 'Terraform'],
      },
    ];
  } else {
    // Default: Full-Stack / Software / Backend Engineer
    roleTech = ['JavaScript / TypeScript', 'React / Next.js', 'Node.js & Express', 'REST & GraphQL APIs', 'SQL (PostgreSQL) & NoSQL (MongoDB)', 'System Design', 'Docker & Deployment', 'Authentication & Security'];
    relatedRoles = [
      { role: 'Full-Stack Engineer', alignmentScore: 89, matchReason: 'Comprehensive frontend, backend API, and database architecture proficiency' },
      { role: 'Backend Engineer', alignmentScore: 83, matchReason: 'Strong server-side logic, API design, and data model orchestration' },
      { role: 'Software Engineer', alignmentScore: 79, matchReason: 'Solid algorithmic problem-solving and full-lifecycle engineering capabilities' },
      { role: 'DevOps-focused Engineer', alignmentScore: 72, matchReason: 'Containerization and production deployment aptitude' },
    ];
    phasesData = [
      {
        phaseNumber: 1,
        title: 'Phase 1: Programming & Frontend Fundamentals',
        description: 'Solidify clean code, TypeScript types, modern React components, and responsive layouts.',
        estimatedTimeline: 'Month 1',
        items: [
          { id: 'item_1_1', title: 'React Fundamentals & Component Architecture', description: 'State management, custom hooks, prop drilling resolution, modularity', status: 'Completed', priority: 'High', resources: ['React Documentation', 'React Patterns'] },
          { id: 'item_1_2', title: 'TypeScript Integration in Full-Stack Apps', description: 'Interface contracts, API response typing, strict type checking', status: 'Completed', priority: 'High', resources: ['TypeScript for React Developers'] },
          { id: 'item_1_3', title: 'Modern CSS & Responsive Glassmorphic UI', description: 'CSS variables, Flexbox/Grid, mobile responsiveness, accessible colors', status: 'Completed', priority: 'Medium', resources: ['CSS-Tricks Flexbox Guide'] },
        ],
      },
      {
        phaseNumber: 2,
        title: 'Phase 2: Backend Architecture & Robust APIs',
        description: 'Develop secure Node/Express/FastAPI backends with structured validation and auth.',
        estimatedTimeline: 'Month 2',
        items: [
          { id: 'item_2_1', title: 'RESTful API Design & Express Middleware', description: 'HTTP verbs, status codes, controller-service pattern, error handling', status: 'In Progress', priority: 'High', resources: ['RESTful Best Practices'] },
          { id: 'item_2_2', title: 'Authentication, JWT & Role-Based Access (RBAC)', description: 'Access/refresh tokens, password hashing, route guards, CSRF/CORS', status: 'In Progress', priority: 'High', resources: ['OWASP Auth Cheat Sheet'] },
        ],
      },
      {
        phaseNumber: 3,
        title: 'Phase 3: Databases, Caching & Data Modeling',
        description: 'Optimize MongoDB and PostgreSQL schemas, indexes, and fast Redis caching.',
        estimatedTimeline: 'Month 3',
        items: [
          { id: 'item_3_1', title: 'Relational & Document Database Mastery', description: 'PostgreSQL queries, MongoDB aggregation pipelines, indexing strategies', status: 'Not Started', priority: 'High', resources: ['PostgreSQL Tutorial', 'MongoDB University'] },
          { id: 'item_3_2', title: 'Caching & Rate Limiting with Redis', description: 'Session stores, caching query results, sliding-window rate limiters', status: 'Not Started', priority: 'Medium', resources: ['Redis University'] },
        ],
      },
      {
        phaseNumber: 4,
        title: 'Phase 4: Scalable System Design & Architecture',
        description: 'Design distributed architectures, microservices, message queues, and load balancing.',
        estimatedTimeline: 'Month 4',
        items: [
          { id: 'item_4_1', title: 'System Design Fundamentals', description: 'Horizontal scaling, load balancers, database sharding, CAP theorem', status: 'Not Started', priority: 'High', resources: ['System Design Primer', 'ByteByteGo'] },
          { id: 'item_4_2', title: 'Asynchronous Processing with Message Queues', description: 'RabbitMQ / BullMQ / Kafka background worker queues', status: 'Not Started', priority: 'Medium', resources: ['BullMQ Guide'] },
        ],
      },
      {
        phaseNumber: 5,
        title: 'Phase 5: Cloud, Docker & Production Deployment',
        description: 'Containerize full-stack services and deploy with automated CI/CD pipelines.',
        estimatedTimeline: 'Month 5-6',
        items: [
          { id: 'item_5_1', title: 'Docker Containerization & Multi-Container Compose', description: 'Production Dockerfiles, volumes, networks, compose orchestration', status: 'Not Started', priority: 'High', resources: ['Docker Official Get Started'] },
          { id: 'item_5_2', title: 'Automated CI/CD with GitHub Actions', description: 'Linting, unit testing, automated build & deployment to cloud (AWS/Render)', status: 'Not Started', priority: 'High', resources: ['GitHub Actions Documentation'] },
        ],
      },
    ];
    projectTemplates = [
      {
        id: 'proj_1',
        title: 'Student Placement & Recruitment Platform API',
        description: 'Build a high-concurrency recruitment platform API with role-based access, resume parsing, and real-time interview notifications.',
        skillsPracticed: ['Node.js', 'Express', 'MongoDB / PostgreSQL', 'JWT / RBAC', 'WebSockets'],
        difficulty: 'Intermediate',
        expectedOutcome: 'Fully documented REST API with OpenAPI/Swagger and 90%+ test coverage.',
        suggestedTechnologies: ['Express.js', 'MongoDB', 'Socket.io', 'Jest', 'Postman'],
      },
      {
        id: 'proj_2',
        title: 'Scalable Distributed Job Processing Engine',
        description: 'Design and implement a distributed background task execution system with rate limiting, retries, and a real-time monitoring dashboard.',
        skillsPracticed: ['System Design', 'Redis', 'BullMQ', 'React', 'Docker'],
        difficulty: 'Advanced',
        expectedOutcome: 'Resilient worker system handling 1,000+ jobs/minute with error tracing.',
        suggestedTechnologies: ['Node.js', 'Redis', 'React', 'Docker Compose'],
      },
      {
        id: 'proj_3',
        title: 'Containerized Multi-Tier Cloud Application',
        description: 'Containerize a full-stack web application with separate frontend, backend, database, and Redis cache containers orchestrated via Docker Compose.',
        skillsPracticed: ['Docker', 'Nginx', 'Cloud Deployment', 'CI/CD'],
        difficulty: 'Intermediate',
        expectedOutcome: 'Single-command deployment with production HTTPS reverse proxy and health checks.',
        suggestedTechnologies: ['Docker', 'Nginx', 'GitHub Actions', 'AWS EC2 / Render'],
      },
    ];
  }

  // Identify skill gaps by matching user's current skills against target role tech
  const skillGaps = [];
  const strongSkills = [];
  const improveSkills = [];
  const learnSkills = [];

  roleTech.forEach((tech) => {
    const isPresent = allKnownTech.some(t => t.toLowerCase().includes(tech.toLowerCase()) || tech.toLowerCase().includes(t.toLowerCase()));
    if (isPresent) {
      strongSkills.push(tech);
      skillGaps.push({
        name: tech,
        category: 'strong',
        currentLevel: 'Proficient',
        requiredLevel: 'Proficient',
        priority: 'Medium',
        reason: `You already have foundation in ${tech}, which matches this role's core requirements.`,
      });
    } else {
      const isPriority = ['System Design', 'Docker', 'REST APIs', 'FastAPI', 'PyTorch', 'Kubernetes', 'TypeScript'].some(p => tech.includes(p));
      if (allKnownTech.length > 0 && Math.random() > 0.6) {
        improveSkills.push(tech);
        skillGaps.push({
          name: tech,
          category: 'improve',
          currentLevel: 'Beginner',
          requiredLevel: 'Advanced',
          priority: isPriority ? 'High' : 'Medium',
          reason: `Enhance your proficiency in ${tech} to meet enterprise-grade expectations for ${targetRole}.`,
        });
      } else {
        learnSkills.push(tech);
        skillGaps.push({
          name: tech,
          category: 'learn',
          currentLevel: 'None',
          requiredLevel: 'Proficient',
          priority: isPriority ? 'High' : 'Medium',
          reason: `${tech} is a key skill gap required to excel as a ${targetRole}.`,
        });
      }
    }
  });

  // Calculate dynamic progress
  const allItems = phasesData.flatMap(p => p.items);
  const completedCount = allItems.filter(i => i.status === 'Completed').length;
  const inProgressCount = allItems.filter(i => i.status === 'In Progress').length;
  const calculatedProgress = allItems.length > 0 
    ? Math.round(((completedCount * 1.0 + inProgressCount * 0.4) / allItems.length) * 100) 
    : 0;

  // Determine next action
  const nextItem = allItems.find(i => i.status === 'In Progress') || allItems.find(i => i.status === 'Not Started') || allItems[0];
  const nextPhase = phasesData.find(p => p.items.some(i => i.id === nextItem?.id)) || phasesData[0];

  return {
    targetRole: targetRole || 'Full-Stack Developer',
    currentLevel,
    overallProgress: calculatedProgress,
    profileStrength,
    missingProfileItems,
    currentSkills: allKnownTech.length > 0 ? allKnownTech : ['JavaScript', 'HTML/CSS', 'Git'],
    existingStrengths: strongSkills.length > 0 ? strongSkills : ['Problem Solving', 'Web Fundamentals'],
    skillGaps,
    roadmapPhases: phasesData,
    recommendedProjects: projectTemplates,
    careerAlignment: relatedRoles,
    nextAction: {
      stepTitle: nextItem ? nextItem.title : 'Complete System Design Fundamentals',
      description: nextItem ? nextItem.description : 'Begin the next phase of your learning roadmap.',
      phaseNumber: nextPhase ? nextPhase.phaseNumber : 1,
      itemId: nextItem ? nextItem.id : 'item_1_1',
    },
  };
};

/**
 * Generate or regenerate a personalized AI Career Roadmap for the authenticated student.
 */
const generateCareerRoadmap = async (userId, customTargetRole = null) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Student profile not found');
  }

  const projects = await Project.find({ user: userId });
  const targetRole = customTargetRole || user.preferredDomain || 'Full-Stack Developer';

  const { profileStrength, missingProfileItems } = calculateProfileStrength(user, projects);

  // Check if AI API key is available
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;
  const grokApiKey = process.env.GROK_API_KEY;
  const openaiApiKey = process.env.OPENAI_INSIGHTS_API_KEY || process.env.OPENAI_API_KEY;
  const apiKey = geminiApiKey || groqApiKey || grokApiKey || openaiApiKey;

  let generatedData = null;

  if (apiKey) {
    try {
      let client;
      let modelName = 'gpt-4o-mini';

      if (geminiApiKey) {
        client = new OpenAI({
          apiKey: geminiApiKey,
          baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        });
        modelName = 'gemini-1.5-flash';
      } else if (groqApiKey) {
        client = new OpenAI({
          apiKey: groqApiKey,
          baseURL: 'https://api.groq.com/openai/v1',
        });
        modelName = 'llama-3.3-70b-versatile';
      } else if (grokApiKey) {
        client = new OpenAI({
          apiKey: grokApiKey,
          baseURL: 'https://api.x.ai/v1',
        });
        modelName = 'grok-beta';
      } else {
        client = new OpenAI({ apiKey: openaiApiKey });
      }

      const prompt = `You are the Lead Career Architect of MAVI Linking, an advanced AI developer platform.
Analyze the following student profile and generate a highly personalized, practical MAVI Career Roadmap for their target career goal.

STUDENT PROFILE:
- Name: ${user.name}
- Target Career Role: ${targetRole}
- Academic: Degree: ${user.degree || 'Computer Science'}, CGPA: ${user.cgpa || 'N/A'}, University: ${user.university?.name || 'N/A'}
- Current Skills: ${(user.skillsList || []).map(s => s.name).join(', ') || 'General Programming'}
- Completed Projects: ${projects.map(p => `${p.title} (Tech: ${(p.technologies || []).join(', ')})`).join('; ') || 'No published projects yet'}
- Developer Integrations:
  * GitHub: ${user.githubUsername || user.platforms?.github?.username ? 'Connected' : 'Not linked'}
  * LeetCode: ${user.platforms?.leetcode?.username ? 'Connected' : 'Not linked'} (Solved: ${user.platformData?.leetcode?.solved || 0})
  * Codeforces: ${user.platforms?.codeforces?.username ? 'Connected' : 'Not linked'}
- Scores: Overall: ${user.scores?.overall || 0}/1000, Dev: ${user.scores?.development || 0}/1000, PS: ${user.scores?.problemSolving || 0}/1000

INSTRUCTIONS:
Return a strictly valid JSON object (no markdown, no backticks, only JSON) matching this structure:
{
  "currentLevel": "Beginner" | "Intermediate" | "Advanced",
  "skillGaps": [
    {
      "name": "Skill Name",
      "category": "strong" | "improve" | "learn",
      "currentLevel": "string",
      "requiredLevel": "string",
      "priority": "High" | "Medium" | "Low",
      "reason": "Why this skill matters for the target role"
    }
  ],
  "roadmapPhases": [
    {
      "phaseNumber": 1,
      "title": "Phase 1: ...",
      "description": "Phase description",
      "estimatedTimeline": "Month 1",
      "items": [
        {
          "id": "item_1_1",
          "title": "Topic title",
          "description": "Short explanation",
          "status": "Not Started" | "In Progress" | "Completed",
          "priority": "High" | "Medium" | "Low",
          "resources": ["Resource 1", "Resource 2"]
        }
      ]
    }
  ],
  "recommendedProjects": [
    {
      "id": "proj_1",
      "title": "Project title",
      "description": "Practical project to address a skill gap",
      "skillsPracticed": ["Skill A", "Skill B"],
      "difficulty": "Beginner" | "Intermediate" | "Advanced",
      "expectedOutcome": "Outcome description",
      "suggestedTechnologies": ["Tech 1", "Tech 2"]
    }
  ],
  "careerAlignment": [
    {
      "role": "Role Name",
      "alignmentScore": 89,
      "matchReason": "Profile alignment rationale"
    }
  ],
  "nextAction": {
    "stepTitle": "Immediate next recommended step",
    "description": "Explanation",
    "phaseNumber": 1,
    "itemId": "item_1_1"
  }
}`;

      const response = await client.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(response.choices[0].message.content);
      if (parsed.roadmapPhases && parsed.skillGaps) {
        // Calculate progress dynamically from returned items
        const allItems = parsed.roadmapPhases.flatMap(p => p.items || []);
        const completedCount = allItems.filter(i => i.status === 'Completed').length;
        const inProgressCount = allItems.filter(i => i.status === 'In Progress').length;
        const progress = allItems.length > 0 
          ? Math.round(((completedCount * 1.0 + inProgressCount * 0.4) / allItems.length) * 100) 
          : 0;

        generatedData = {
          targetRole,
          currentLevel: parsed.currentLevel || inferCurrentLevel(user, projects),
          overallProgress: progress,
          profileStrength,
          missingProfileItems,
          currentSkills: (user.skillsList || []).map(s => s.name),
          existingStrengths: parsed.skillGaps.filter(g => g.category === 'strong').map(g => g.name),
          skillGaps: parsed.skillGaps,
          roadmapPhases: parsed.roadmapPhases,
          recommendedProjects: parsed.recommendedProjects || [],
          careerAlignment: parsed.careerAlignment || [],
          nextAction: parsed.nextAction || {
            stepTitle: allItems[0]?.title || 'Get Started with Phase 1',
            description: allItems[0]?.description || 'Begin your roadmap journey.',
            phaseNumber: 1,
            itemId: allItems[0]?.id || 'item_1_1',
          },
        };
      }
    } catch (aiErr) {
      console.warn('AI Roadmap generation error (falling back to deterministic engine):', aiErr.message);
    }
  }

  // If AI generation failed or wasn't available, use high-fidelity deterministic engine
  if (!generatedData) {
    generatedData = generateDeterministicRoadmap(user, projects, targetRole, profileStrength, missingProfileItems);
  }

  // Upsert the student roadmap in MongoDB
  const roadmap = await CareerRoadmap.findOneAndUpdate(
    { user: userId },
    {
      ...generatedData,
      user: userId,
      maviId: user.maviId || '',
      generatedAt: new Date(),
      lastProfileSyncAt: new Date(),
      status: 'active',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return roadmap;
};

/**
 * Retrieve active roadmap for the authenticated student.
 */
const getStudentRoadmap = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  let roadmap = await CareerRoadmap.findOne({ user: userId, status: 'active' });
  const projects = await Project.find({ user: userId });
  const { profileStrength, missingProfileItems } = calculateProfileStrength(user, projects);

  // If no roadmap exists yet, create one on the fly
  if (!roadmap) {
    roadmap = await generateCareerRoadmap(userId, user.preferredDomain || 'Full-Stack Developer');
  }

  // Check if profile was updated after roadmap generation
  const profileChangedSinceGeneration = user.updatedAt && roadmap.generatedAt 
    ? new Date(user.updatedAt).getTime() > new Date(roadmap.generatedAt).getTime() + 60000 
    : false;

  return {
    roadmap,
    profileStrength,
    missingProfileItems,
    profileChangedSinceGeneration,
  };
};

/**
 * Update the status of a specific roadmap milestone and recalculate overall progress.
 */
const updateRoadmapProgress = async (userId, itemId, newStatus) => {
  if (!['Not Started', 'In Progress', 'Completed'].includes(newStatus)) {
    throw new Error('Invalid status. Must be "Not Started", "In Progress", or "Completed"');
  }

  const roadmap = await CareerRoadmap.findOne({ user: userId });
  if (!roadmap) {
    throw new Error('Career roadmap not found');
  }

  let itemFound = false;
  roadmap.roadmapPhases.forEach((phase) => {
    phase.items.forEach((item) => {
      if (item.id === itemId) {
        item.status = newStatus;
        itemFound = true;
      }
    });
  });

  if (!itemFound) {
    throw new Error(`Roadmap item with ID "${itemId}" not found`);
  }

  // Recalculate dynamic progress
  const allItems = roadmap.roadmapPhases.flatMap(p => p.items);
  const completedCount = allItems.filter(i => i.status === 'Completed').length;
  const inProgressCount = allItems.filter(i => i.status === 'In Progress').length;
  roadmap.overallProgress = allItems.length > 0 
    ? Math.min(100, Math.round(((completedCount * 1.0 + inProgressCount * 0.4) / allItems.length) * 100))
    : 0;

  // Update next action to next in-progress or not-started item
  const nextItem = allItems.find(i => i.status === 'In Progress') || allItems.find(i => i.status === 'Not Started');
  if (nextItem) {
    const nextPhase = roadmap.roadmapPhases.find(p => p.items.some(i => i.id === nextItem.id));
    roadmap.nextAction = {
      stepTitle: nextItem.title,
      description: nextItem.description,
      phaseNumber: nextPhase ? nextPhase.phaseNumber : 1,
      itemId: nextItem.id,
    };
  } else {
    roadmap.nextAction = {
      stepTitle: 'All Milestones Completed! 🎉',
      description: 'You have completed all planned phases. Ready for mock interviews and live recruitment applications.',
      phaseNumber: roadmap.roadmapPhases.length,
      itemId: 'completed',
    };
  }

  await roadmap.save();
  return roadmap;
};

/**
 * Update target career goal for student.
 */
  const { normalizeDomain } = require('../constants/domainOptions');
  const role = targetRole.trim();
  const domain = normalizeDomain(role);

  // Update user preferredRole and canonical preferredDomain
  await User.findByIdAndUpdate(userId, {
    preferredRole: role,
    preferredDomain: domain,
  });

  // Regenerate roadmap with new target goal
  const roadmap = await generateCareerRoadmap(userId, role);
  return roadmap;
};

module.exports = {
  calculateProfileStrength,
  generateCareerRoadmap,
  getStudentRoadmap,
  updateRoadmapProgress,
  updateTargetCareerGoal,
};
