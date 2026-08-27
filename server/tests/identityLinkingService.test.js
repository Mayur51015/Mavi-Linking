const {
  normalizeExternalId,
  createPlatformAccountId,
} = require('../src/services/identityLinkingService');

describe('Multi-source identity resolution', () => {
  it('creates a platform-specific account identifier', () => {
    expect(
      createPlatformAccountId('github', '12345')
    ).toBe('github:12345');

    expect(
      createPlatformAccountId('leetcode', 'RevatiKadam')
    ).toBe('leetcode:revatikadam');
  });

  it('normalizes GitHub identity using the external account id when available', () => {
    const id = normalizeExternalId(
      'github',
      'revati',
      {
        profile: {
          id: 12345,
          username: 'revati',
        },
      }
    );

    expect(id).toBe('12345');
  });

  it('falls back to GitHub username when external id is unavailable', () => {
    const id = normalizeExternalId(
      'github',
      'RevatiKadam',
      {
        username: 'RevatiKadam',
      }
    );

    expect(id).toBe('RevatiKadam');
  });

  it('uses the Codeforces handle as the external identity', () => {
    const id = normalizeExternalId(
      'codeforces',
      'RevatiKadam',
      {
        handle: 'RevatiKadam',
      }
    );

    expect(id).toBe('revatikadam');
  });

  it('uses the LeetCode username as the external identity', () => {
    const id = normalizeExternalId(
      'leetcode',
      'RevatiKadam',
      {
        username: 'RevatiKadam',
      }
    );

    expect(id).toBe('revatikadam');
  });

  it('uses the Stack Overflow user id as the external identity', () => {
    const id = normalizeExternalId(
      'stackoverflow',
      '123456',
      {
        userId: 123456,
      }
    );

    expect(id).toBe('123456');
  });

  it('keeps accounts on different platforms separate', () => {
    const githubId = createPlatformAccountId(
      'github',
      '12345'
    );

    const leetcodeId = createPlatformAccountId(
      'leetcode',
      '12345'
    );

    expect(githubId).not.toBe(leetcodeId);
  });

  it('normalizes case-insensitive platform usernames', () => {
    expect(
      createPlatformAccountId('leetcode', 'REVATI')
    ).toBe('leetcode:revati');

    expect(
      createPlatformAccountId('codeforces', 'REVATI')
    ).toBe('codeforces:revati');
  });
});