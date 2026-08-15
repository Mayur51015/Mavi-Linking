const User = require('../src/models/User');

/**
 * These tests exercise the model in isolation — no database connection is
 * needed, because everything under test (schema options, toJSON) is resolved
 * locally by Mongoose.
 */

const SECRET_FIELDS = [
  'password',
  'refreshToken',
  'resetPasswordToken',
  'resetPasswordExpires',
  'verificationToken',
  'verificationTokenExpires',
  'verificationCode',
];

function buildUser(overrides = {}) {
  return new User({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'Sup3rSecret',
    refreshToken: 'refresh-token-value',
    resetPasswordToken: 'reset-token-value',
    resetPasswordExpires: new Date(Date.now() + 3600000),
    verificationToken: 'verify-token-value',
    verificationCode: '123456',
    ...overrides,
  });
}

describe('User schema — sensitive field projection', () => {
  it('exposes the canonical list of sensitive fields', () => {
    expect(User.SENSITIVE_FIELDS).toEqual(expect.arrayContaining(SECRET_FIELDS));
  });

  it.each(SECRET_FIELDS)('marks %s as select:false so it is not loaded by default', (field) => {
    const path = User.schema.path(field);
    expect(path).toBeDefined();
    expect(path.options.select).toBe(false);
  });

  it('leaves ordinary profile fields selectable', () => {
    for (const field of ['name', 'email', 'role', 'bio']) {
      const select = User.schema.path(field).options.select;
      expect(select).not.toBe(false);
    }
  });
});

describe('User.toJSON()', () => {
  it('strips every sensitive field even when the values are populated', () => {
    const json = buildUser().toJSON();

    for (const field of SECRET_FIELDS) {
      expect(json).not.toHaveProperty(field);
    }
  });

  it('strips the mongoose version key', () => {
    expect(buildUser().toJSON()).not.toHaveProperty('__v');
  });

  it('keeps the fields the client actually needs', () => {
    const json = buildUser().toJSON();

    expect(json.name).toBe('Ada Lovelace');
    expect(json.email).toBe('ada@example.com');
    expect(json.role).toBe('user');
    expect(json).toHaveProperty('scores');
    expect(json).toHaveProperty('platforms');
  });

  it('produces the same result after an explicit +select loads the secrets', () => {
    // Simulates `User.findById(id).select('+refreshToken')` — the value is on
    // the document, but it still must not survive serialization.
    const user = buildUser();
    user.refreshToken = 'explicitly-selected-token';

    expect(user.refreshToken).toBe('explicitly-selected-token');
    expect(user.toJSON()).not.toHaveProperty('refreshToken');
  });

  it('survives a JSON.stringify round-trip without leaking secrets', () => {
    // res.json() goes through JSON.stringify, which calls toJSON for us.
    const serialized = JSON.stringify({ success: true, data: { user: buildUser() } });

    for (const value of [
      'refresh-token-value',
      'reset-token-value',
      'verify-token-value',
      'Sup3rSecret',
      '123456',
    ]) {
      expect(serialized).not.toContain(value);
    }
  });

  it('does not leak secrets for a list of users, as returned by /api/admin/users', () => {
    const users = [
      buildUser(),
      buildUser({ email: 'grace@example.com', refreshToken: 'second-refresh-token' }),
    ];

    const serialized = JSON.stringify({ success: true, data: { users } });

    expect(serialized).not.toContain('refresh-token-value');
    expect(serialized).not.toContain('second-refresh-token');
    expect(serialized).toContain('grace@example.com');
  });
});
