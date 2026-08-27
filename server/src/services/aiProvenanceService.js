const crypto = require('crypto');

const PROVENANCE_SCHEMA_VERSION = '1.0.0';
const PROMPT_VERSION = '1.0.0';

const createEvidenceId = (platform, metric) =>
  `evidence_${crypto
    .createHash('sha1')
    .update(`${platform}:${metric}`)
    .digest('hex')
    .slice(0, 12)}`;

const buildEvidencePayload = (user) => {
  const platformData = user.platformData || {};
  const syncMetadata = user.platformSync || {};
  const evidence = [];

  const addMetric = (platform, metric, value) => {
    if (value === undefined || value === null) return;

    evidence.push({
      id: createEvidenceId(platform, metric),
      platform,
      metric,
      value,
      dataTimestamp:
        syncMetadata[platform]?.lastSuccessfulSyncAt || null,
    });
  };

  const github = platformData.github;
  if (github) {
    const profile = github.profile || github;

    addMetric('github', 'publicRepos', profile.publicRepos);
    addMetric('github', 'followers', profile.followers);
    addMetric('github', 'following', profile.following);
    addMetric('github', 'commits30Days', github.commits?.recentCount30Days);
    addMetric('github', 'mergedPullRequests', github.pullRequests?.merged);
    addMetric('github', 'externalReposContributed', github.openSource?.externalReposContributed);
  }

  const leetcode = platformData.leetcode;
  if (leetcode) {
    addMetric('leetcode', 'solved', leetcode.solved);
    addMetric('leetcode', 'easySolved', leetcode.solvedEasy);
    addMetric('leetcode', 'mediumSolved', leetcode.solvedMedium);
    addMetric('leetcode', 'hardSolved', leetcode.solvedHard);
    addMetric('leetcode', 'ranking', leetcode.ranking);
  }

  const codeforces = platformData.codeforces;
  if (codeforces) {
    addMetric('codeforces', 'rating', codeforces.rating);
    addMetric('codeforces', 'maxRating', codeforces.maxRating);
    addMetric('codeforces', 'rank', codeforces.rank);
    addMetric('codeforces', 'contribution', codeforces.contribution);
  }

  const stackoverflow = platformData.stackoverflow;
  if (stackoverflow) {
    addMetric('stackoverflow', 'reputation', stackoverflow.reputation);
    addMetric('stackoverflow', 'goldBadges', stackoverflow.goldBadges);
    addMetric('stackoverflow', 'silverBadges', stackoverflow.silverBadges);
    addMetric('stackoverflow', 'bronzeBadges', stackoverflow.bronzeBadges);
    addMetric('stackoverflow', 'answerCount', stackoverflow.answerCount);
    addMetric('stackoverflow', 'questionCount', stackoverflow.questionCount);
  }

  return evidence;
};

const buildEvidenceContext = (user) => {
  const evidence = buildEvidencePayload(user);

  const platforms = [...new Set(evidence.map(item => item.platform))];

  return {
    evidence,
    platforms,
    generatedFrom: evidence.length > 0 ? 'verified_platform_metrics' : 'insufficient_evidence',
    evidenceCoverage:
      evidence.length > 0
        ? Math.min(Math.round((evidence.length / 20) * 100), 100)
        : 0,
  };
};

const normalizeClaims = (claims, evidence) => {
  if (!Array.isArray(claims)) return [];

  const evidenceIds = new Set(evidence.map(item => item.id));

  return claims
    .filter(
      claim =>
        claim &&
        typeof claim.text === 'string' &&
        claim.text.trim() &&
        Array.isArray(claim.evidenceIds)
    )
    .map(claim => ({
      text: claim.text.trim(),
      evidenceIds: claim.evidenceIds.filter(id => evidenceIds.has(id)),
    }))
    .filter(claim => claim.evidenceIds.length > 0);
};

const validateAndNormalizeAIResult = (result, evidence) => {
  if (!result || typeof result !== 'object') {
    throw new Error('AI response is not a valid object');
  }

  if (!result.insight || typeof result.insight !== 'object') {
    throw new Error('AI response is missing the insight object');
  }

  const claims = normalizeClaims(result.insight.claims, evidence);

  if (evidence.length > 0 && claims.length === 0) {
    result.insight.uncertainty = {
      state: 'uncertain',
      reason: 'No generated claim could be linked to verified evidence.',
    };
  }

  result.insight.claims = claims;

  return result;
};

const buildProvenance = (user, provider, evidence, result) => ({
  evidence: evidence.map(item => ({
    id: item.id,
    platform: item.platform,
    metric: item.metric,
    value: item.value,
    dataTimestamp: item.dataTimestamp,
  })),
  sourcePlatforms: [...new Set(evidence.map(item => item.platform))],
  dataTimestamps: [
    ...new Set(
      evidence
        .map(item => item.dataTimestamp)
        .filter(Boolean)
        .map(timestamp => new Date(timestamp).toISOString())
    ),
  ],
  provider: provider?.constructor?.name || 'local',
  model: provider?.modelName || 'local-fallback',
  promptVersion: PROMPT_VERSION,
  schemaVersion: PROVENANCE_SCHEMA_VERSION,
  generatedAt: new Date(),
  evidenceCoverage:
    evidence.length > 0 && result?.insight?.claims?.length > 0
      ? Math.min(
          Math.round(
            (result.insight.claims.reduce(
              (total, claim) => total + claim.evidenceIds.length,
              0
            ) /
              evidence.length) *
              100
          ),
          100
        )
      : 0,
  uncertainty: result?.insight?.uncertainty || {
    state: 'supported',
    reason: null,
  },
});

module.exports = {
  PROVENANCE_SCHEMA_VERSION,
  PROMPT_VERSION,
  buildEvidencePayload,
  buildEvidenceContext,
  validateAndNormalizeAIResult,
  buildProvenance,
};