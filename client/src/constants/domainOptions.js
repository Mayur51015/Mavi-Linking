/**
 * Canonical Career Domains and Target Roles for MAVI Linking (Frontend).
 */

export const CANONICAL_DOMAINS = [
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
];

export const ROLE_TO_DOMAIN_MAP = {
  'full-stack developer': 'Full-Stack Development',
  'full stack developer': 'Full-Stack Development',
  'full-stack engineer': 'Full-Stack Development',
  'full stack engineer': 'Full-Stack Development',
  'frontend developer': 'Frontend Development',
  'frontend engineer': 'Frontend Development',
  'backend developer': 'Backend Development',
  'backend engineer': 'Backend Development',
  'mobile developer': 'Mobile App Development',
  'data scientist': 'Data Science & Analytics',
  'data engineer': 'Data Science & Analytics',
  'machine learning engineer': 'AI / Machine Learning',
  'devops engineer': 'Cloud & DevOps',
  'cloud engineer': 'Cloud & DevOps',
  'cybersecurity analyst': 'Cybersecurity',
  'blockchain developer': 'Blockchain & Web3',
};

export function normalizeDomain(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  const matchedDomain = CANONICAL_DOMAINS.find(
    (d) => d.toLowerCase() === trimmed.toLowerCase()
  );
  if (matchedDomain) return matchedDomain;

  const mapped = ROLE_TO_DOMAIN_MAP[trimmed.toLowerCase()];
  if (mapped) return mapped;

  return trimmed;
}
