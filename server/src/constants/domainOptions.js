/**
 * Canonical Career Domains and Target Roles for MAVI Linking.
 * Provides normalized domains, valid domain enums, and mapping from job roles to career domains.
 */

const CANONICAL_DOMAINS = [
  'Software Development',
  'Full-Stack Development',
  'Frontend Development',
  'Backend Development',
  'Mobile App Development',
  'AI / Machine Learning',
  'Data Science & Analytics',
  'Cloud & DevOps',
  'Cybersecurity',
  'Blockchain & Web3',
  'Embedded Systems & IoT',
  'Game Development',
  'UI/UX & Product Design',
  'Quality Assurance & Testing',
  'Other',
  '',
];

const ROLE_TO_DOMAIN_MAP = {
  'full-stack developer': 'Full-Stack Development',
  'full stack developer': 'Full-Stack Development',
  'full-stack engineer': 'Full-Stack Development',
  'full stack engineer': 'Full-Stack Development',
  'frontend developer': 'Frontend Development',
  'frontend engineer': 'Frontend Development',
  'backend developer': 'Backend Development',
  'backend engineer': 'Backend Development',
  'mobile developer': 'Mobile App Development',
  'ios developer': 'Mobile App Development',
  'android developer': 'Mobile App Development',
  'data scientist': 'Data Science & Analytics',
  'data analyst': 'Data Science & Analytics',
  'data engineer': 'Data Science & Analytics',
  'machine learning engineer': 'AI / Machine Learning',
  'ai engineer': 'AI / Machine Learning',
  'ai / ml engineer': 'AI / Machine Learning',
  'devops engineer': 'Cloud & DevOps',
  'cloud engineer': 'Cloud & DevOps',
  'cloud architect': 'Cloud & DevOps',
  'cybersecurity analyst': 'Cybersecurity',
  'security engineer': 'Cybersecurity',
  'penetration tester': 'Cybersecurity',
  'blockchain developer': 'Blockchain & Web3',
  'smart contract developer': 'Blockchain & Web3',
  'web developer': 'Software Development',
  'software engineer': 'Software Development',
  'software developer': 'Software Development',
};

/**
 * Normalize an input string into a canonical domain.
 * If the input is a specific job role (e.g. "Full-Stack Developer"), it maps to the parent domain.
 */
function normalizeDomain(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Exact match with canonical domains (case-insensitive)
  const matchedDomain = CANONICAL_DOMAINS.find(
    (d) => d.toLowerCase() === trimmed.toLowerCase()
  );
  if (matchedDomain) return matchedDomain;

  // Match against role-to-domain mapping
  const mapped = ROLE_TO_DOMAIN_MAP[trimmed.toLowerCase()];
  if (mapped) return mapped;

  return trimmed;
}

module.exports = {
  CANONICAL_DOMAINS,
  ROLE_TO_DOMAIN_MAP,
  normalizeDomain,
};
