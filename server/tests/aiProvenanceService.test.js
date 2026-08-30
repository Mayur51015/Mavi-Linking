const {
  buildEvidencePayload,
  validateAndNormalizeAIResult,
  buildProvenance,
} = require('../src/services/aiProvenanceService');

describe('AI provenance and hallucination guardrails', () => {
  const buildUser = () => ({
    platformData: {
      github: {
        profile: {
          publicRepos: 12,
          followers: 30,
        },
        commits: {
          recentCount30Days: 8,
        },
      },
      leetcode: {
        solved: 100,
        solvedEasy: 50,
        solvedMedium: 40,
        solvedHard: 10,
      },
    },
    platformSync: {
      github: {
        lastSuccessfulSyncAt: new Date('2026-08-20T10:00:00.000Z'),
      },
      leetcode: {
        lastSuccessfulSyncAt: new Date('2026-08-21T10:00:00.000Z'),
      },
    },
  });

  it('builds structured evidence from verified platform metrics', () => {
    const evidence = buildEvidencePayload(buildUser());

    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          platform: 'github',
          metric: 'publicRepos',
          value: 12,
        }),
        expect.objectContaining({
          platform: 'leetcode',
          metric: 'solved',
          value: 100,
        }),
      ])
    );

    expect(evidence[0].id).toMatch(/^evidence_/);
  });

  it('marks an output uncertain when no claim can be linked to evidence', () => {
    const evidence = buildEvidencePayload(buildUser());

    const result = validateAndNormalizeAIResult(
      {
        insight: {
          specialization: 'Full Stack Developer',
          claims: [],
        },
      },
      evidence
    );

    expect(result.insight.uncertainty.state).toBe('uncertain');
  });

  it('removes references to unknown evidence IDs', () => {
    const evidence = buildEvidencePayload(buildUser());

    const validEvidenceId = evidence[0].id;

    const result = validateAndNormalizeAIResult(
      {
        insight: {
          claims: [
            {
              text: 'Supported claim',
              evidenceIds: [validEvidenceId, 'fake-evidence-id'],
            },
          ],
        },
      },
      evidence
    );

    expect(result.insight.claims).toHaveLength(1);
    expect(result.insight.claims[0].evidenceIds).toEqual([
      validEvidenceId,
    ]);
  });

  it('rejects malformed AI output', () => {
    const evidence = buildEvidencePayload(buildUser());

    expect(() =>
      validateAndNormalizeAIResult(
        {
          unexpected: true,
        },
        evidence
      )
    ).toThrow('missing the insight object');
  });

  it('rejects non-object AI output', () => {
    const evidence = buildEvidencePayload(buildUser());

    expect(() =>
      validateAndNormalizeAIResult(
        'not-json',
        evidence
      )
    ).toThrow('not a valid object');
  });

  it('records provider, model, versions, timestamps and evidence coverage', () => {
    const user = buildUser();
    const evidence = buildEvidencePayload(user);

    const result = validateAndNormalizeAIResult(
      {
        insight: {
          claims: [
            {
              text: 'The developer solved 100 problems.',
              evidenceIds: [
                evidence.find(
                  item =>
                    item.platform === 'leetcode' &&
                    item.metric === 'solved'
                ).id,
              ],
            },
          ],
        },
      },
      evidence
    );

    const provenance = buildProvenance(
      user,
      {
        constructor: { name: 'TestProvider' },
        modelName: 'test-model',
      },
      evidence,
      result
    );

    expect(provenance.provider).toBe('TestProvider');
    expect(provenance.model).toBe('test-model');
    expect(provenance.promptVersion).toBe('1.0.0');
    expect(provenance.schemaVersion).toBe('1.0.0');
    expect(provenance.generatedAt).toBeInstanceOf(Date);
    expect(provenance.evidenceCoverage).toBeGreaterThan(0);
  });

  it('preserves separate evidence when source metrics conflict', () => {
    const user = buildUser();

    user.platformData.codeforces = {
      rating: 1200,
    };

    user.platformData.leetcode = {
      solved: 120,
      solvedEasy: 60,
      solvedMedium: 50,
      solvedHard: 10,
    };

    const evidence = buildEvidencePayload(user);

    const codeforcesRating = evidence.find(
      item =>
        item.platform === 'codeforces' &&
        item.metric === 'rating'
    );

    const leetcodeSolved = evidence.find(
      item =>
        item.platform === 'leetcode' &&
        item.metric === 'solved'
    );

    expect(codeforcesRating).toBeDefined();
    expect(leetcodeSolved).toBeDefined();
    expect(codeforcesRating.id).not.toBe(leetcodeSolved.id);
    expect(codeforcesRating.value).toBe(1200);
    expect(leetcodeSolved.value).toBe(120);
  });
});