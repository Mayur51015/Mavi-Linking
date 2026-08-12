const User = require('../src/models/User');

/**
 * Covers the model half of "a password reset ends existing sessions".
 * The middleware calls user.isTokenStale(decoded.iat) and refuses the request
 * when it returns true.
 */

const secondsAgo = (n) => Math.floor((Date.now() - n * 1000) / 1000);

function userWithChangeAt(date) {
  const user = new User({ name: 'Test User', email: 'test@example.com', password: 'Passw0rd' });
  user.passwordChangedAt = date;
  return user;
}

describe('User#isTokenStale', () => {
  it('accepts any token when the password has never been changed', () => {
    const user = userWithChangeAt(null);
    expect(user.isTokenStale(secondsAgo(60 * 60 * 24 * 30))).toBe(false);
  });

  it('rejects a token issued before the last password change', () => {
    const user = userWithChangeAt(new Date());
    expect(user.isTokenStale(secondsAgo(3600))).toBe(true);
  });

  it('accepts a token issued after the last password change', () => {
    const user = userWithChangeAt(new Date(Date.now() - 3600 * 1000));
    expect(user.isTokenStale(secondsAgo(10))).toBe(false);
  });

  it('treats a missing iat claim as not stale rather than throwing', () => {
    const user = userWithChangeAt(new Date());
    expect(user.isTokenStale(undefined)).toBe(false);
    expect(user.isTokenStale(0)).toBe(false);
  });

  it('errs towards stale for a token minted in the same second as the change', () => {
    const now = new Date();
    const user = userWithChangeAt(new Date(now.getTime() + 500));
    expect(user.isTokenStale(Math.floor(now.getTime() / 1000))).toBe(true);
  });

  it('exposes passwordChangedAt on the schema', () => {
    expect(User.schema.path('passwordChangedAt')).toBeDefined();
  });
});
