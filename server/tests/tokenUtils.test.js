const crypto = require('crypto');
const { hashToken, createHashedToken, safeCompare, TOKEN_BYTES } = require('../src/utils/tokenUtils');

describe('hashToken', () => {
  it('produces a SHA-256 hex digest', () => {
    const digest = hashToken('hello');
    expect(digest).toBe(crypto.createHash('sha256').update('hello').digest('hex'));
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for the same input', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
  });

  it('produces different digests for different inputs', () => {
    expect(hashToken('abc')).not.toBe(hashToken('abd'));
  });

  it('coerces non-string input rather than throwing', () => {
    expect(() => hashToken(12345)).not.toThrow();
    expect(hashToken(12345)).toBe(hashToken('12345'));
  });
});

describe('createHashedToken', () => {
  it('returns a raw token and its matching digest', () => {
    const { rawToken, hashedToken } = createHashedToken();
    expect(hashToken(rawToken)).toBe(hashedToken);
  });

  it('returns a raw token of the expected entropy', () => {
    const { rawToken } = createHashedToken();
    expect(rawToken).toHaveLength(TOKEN_BYTES * 2);
    expect(rawToken).toMatch(/^[0-9a-f]+$/);
  });

  it('never stores the raw token as the digest', () => {
    const { rawToken, hashedToken } = createHashedToken();
    expect(hashedToken).not.toBe(rawToken);
  });

  it('produces a distinct token on every call', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => createHashedToken().rawToken));
    expect(tokens.size).toBe(50);
  });
});

describe('safeCompare', () => {
  it('returns true for identical strings', () => {
    expect(safeCompare('abc123', 'abc123')).toBe(true);
  });

  it('returns false for different strings of equal length', () => {
    expect(safeCompare('abc123', 'abc124')).toBe(false);
  });

  it('returns false for strings of different lengths without throwing', () => {
    expect(() => safeCompare('short', 'considerably-longer')).not.toThrow();
    expect(safeCompare('short', 'considerably-longer')).toBe(false);
  });
});
