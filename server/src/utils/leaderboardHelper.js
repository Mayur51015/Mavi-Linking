const PRIVILEGED_ROLES = [
  'super_admin',
  'superadmin',
  'admin',
  'institution_admin',
  'platform_owner',
  'owner',
];

/**
 * Calculate Developer Score Tier based strictly on user's score.
 * 0–199: Beginner
 * 200–399: Developing
 * 400–599: Intermediate
 * 600–799: Advanced
 * 800–949: Expert
 * 950–1000: Exceptional
 */
const calculateScoreTier = (score) => {
  const val = Number(score) || 0;
  if (val >= 950) return 'Exceptional';
  if (val >= 800) return 'Expert';
  if (val >= 600) return 'Advanced';
  if (val >= 400) return 'Intermediate';
  if (val >= 200) return 'Developing';
  return 'Beginner';
};

/**
 * Calculate Leaderboard Medal based strictly on user's rank.
 * Rank 1: GOLD
 * Rank 2: SILVER
 * Rank 3: BRONZE
 * Rank 4+: null
 */
const calculateMedal = (rank) => {
  const r = Number(rank);
  if (r === 1) return 'GOLD';
  if (r === 2) return 'SILVER';
  if (r === 3) return 'BRONZE';
  return null;
};

/**
 * Sort eligible leaderboard users with deterministic tie-breaking:
 * Primary: scores.overall (desc)
 * Secondary: scores.problemSolving (desc)
 * Tertiary: scores.development (desc)
 * Final: maviId / _id (asc)
 */
const sortLeaderboardUsers = (users) => {
  return [...users].sort((a, b) => {
    const scoreA = a.scores?.overall || a.score || 0;
    const scoreB = b.scores?.overall || b.score || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;

    const psA = a.scores?.problemSolving || 0;
    const psB = b.scores?.problemSolving || 0;
    if (psB !== psA) return psB - psA;

    const devA = a.scores?.development || 0;
    const devB = b.scores?.development || 0;
    if (devB !== devA) return devB - devA;

    const idA = String(a.maviId || a._id || '');
    const idB = String(b.maviId || b._id || '');
    return idA.localeCompare(idB);
  });
};

module.exports = {
  PRIVILEGED_ROLES,
  calculateScoreTier,
  calculateMedal,
  sortLeaderboardUsers,
};
