const {
  OWNER_ADMIN_ID,
  OWNER_ROLES,
  DEFAULT_INSTITUTIONS,
  MAVI_ID_BATCH_SIZE,
  MAVI_ID_MAX_PER_BOOT,
  parseEmailList,
  resolveOwnerCredentials,
  resolveSuperAdminEmails,
  shouldSeedInstitutions,
  migrateLegacyRoles,
  grantSuperAdmin,
  bootstrapPlatformOwner,
  backfillMaviIds,
  cleanupGoogleIdIndex,
  seedDefaultInstitutions,
  runStartupTasks,
} = require('../src/startup/bootstrap');

/**
 * No database here — the bootstrap module takes its models as arguments, so
 * every decision it makes can be asserted against a stub.
 */

const silentLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('parseEmailList', () => {
  it('splits on commas, semicolons and whitespace', () => {
    expect(parseEmailList('a@x.com, b@x.com;c@x.com d@x.com')).toEqual([
      'a@x.com',
      'b@x.com',
      'c@x.com',
      'd@x.com',
    ]);
  });

  it('lowercases and de-duplicates', () => {
    expect(parseEmailList('Owner@X.com,owner@x.com')).toEqual(['owner@x.com']);
  });

  it('drops entries that are not email-shaped', () => {
    expect(parseEmailList('valid@x.com, not-an-email, , @')).toEqual(['valid@x.com']);
  });

  it('returns an empty list for unset or non-string values', () => {
    for (const value of [undefined, null, '', 42, {}]) {
      expect(parseEmailList(value)).toEqual([]);
    }
  });
});

describe('resolveOwnerCredentials', () => {
  it('refuses to start in production without OWNER_EMAIL and OWNER_PASSWORD', () => {
    expect(() => resolveOwnerCredentials({ NODE_ENV: 'production' })).toThrow(
      /OWNER_EMAIL and OWNER_PASSWORD must be set/u
    );
  });

  it('names only the variable that is actually missing', () => {
    expect(() =>
      resolveOwnerCredentials({ NODE_ENV: 'production', OWNER_EMAIL: 'o@x.com' })
    ).toThrow(/OWNER_PASSWORD must be set/u);

    expect(() =>
      resolveOwnerCredentials({ NODE_ENV: 'production', OWNER_PASSWORD: 'a-long-password' })
    ).toThrow(/OWNER_EMAIL must be set/u);
  });

  it('rejects a short production password', () => {
    expect(() =>
      resolveOwnerCredentials({
        NODE_ENV: 'production',
        OWNER_EMAIL: 'o@x.com',
        OWNER_PASSWORD: 'short',
      })
    ).toThrow(/at least 12 characters/u);
  });

  it('uses the configured production credentials verbatim, lowercasing the email', () => {
    expect(
      resolveOwnerCredentials({
        NODE_ENV: 'production',
        OWNER_EMAIL: '  Owner@Example.COM ',
        OWNER_PASSWORD: 'a-properly-long-password',
      })
    ).toEqual({
      email: 'owner@example.com',
      password: 'a-properly-long-password',
      generated: false,
    });
  });

  it('generates a development password rather than falling back to a literal', () => {
    const first = resolveOwnerCredentials({ NODE_ENV: 'development' });
    const second = resolveOwnerCredentials({ NODE_ENV: 'development' });

    expect(first.generated).toBe(true);
    expect(first.password).not.toBe(second.password);
    expect(first.password.length).toBeGreaterThanOrEqual(20);
  });

  it('never produces the password that used to be hardcoded', () => {
    for (let i = 0; i < 25; i += 1) {
      expect(resolveOwnerCredentials({ NODE_ENV: 'development' }).password).not.toBe(
        'MaviOwner@2026!'
      );
    }
  });

  it('honours a development password when one is supplied', () => {
    const creds = resolveOwnerCredentials({
      NODE_ENV: 'development',
      OWNER_PASSWORD: 'dev-chosen',
    });

    expect(creds).toMatchObject({ password: 'dev-chosen', generated: false });
  });
});

describe('resolveSuperAdminEmails', () => {
  it('promotes nobody when nothing is configured', () => {
    expect(resolveSuperAdminEmails({})).toEqual([]);
  });

  it('reads the list from SUPER_ADMIN_EMAILS', () => {
    expect(resolveSuperAdminEmails({ SUPER_ADMIN_EMAILS: 'a@x.com,b@x.com' })).toEqual([
      'a@x.com',
      'b@x.com',
    ]);
  });

  it('still honours the older singular SUPER_ADMIN_EMAIL', () => {
    expect(
      resolveSuperAdminEmails({ SUPER_ADMIN_EMAILS: 'a@x.com', SUPER_ADMIN_EMAIL: 'b@x.com' })
    ).toEqual(['a@x.com', 'b@x.com']);
  });

  it('contains no addresses baked into the source', () => {
    // The regression this guards: five personal Gmail addresses were promoted
    // to super_admin on every boot, two of them generic enough for anyone to
    // register.
    const previouslyHardcoded = [
      'mayur2006khandare@gmail.com',
      'khandaremayur420@gmail.com',
      'mayur@gmail.com',
      'mavi118@gmail.com',
      'armansunasara70@gmail.com',
    ];

    const source = require('fs').readFileSync(
      require.resolve('../src/startup/bootstrap'),
      'utf8'
    );

    for (const email of previouslyHardcoded) {
      expect(resolveSuperAdminEmails({})).not.toContain(email);
      expect(source).not.toContain(email);
    }
  });
});

describe('shouldSeedInstitutions', () => {
  it('is off unless explicitly enabled', () => {
    for (const env of [{}, { SEED_DEFAULT_INSTITUTIONS: '' }, { SEED_DEFAULT_INSTITUTIONS: 'no' }]) {
      expect(shouldSeedInstitutions(env)).toBe(false);
    }
  });

  it('accepts any casing of "true"', () => {
    expect(shouldSeedInstitutions({ SEED_DEFAULT_INSTITUTIONS: 'TRUE' })).toBe(true);
    expect(shouldSeedInstitutions({ SEED_DEFAULT_INSTITUTIONS: 'true' })).toBe(true);
  });
});

describe('migrateLegacyRoles', () => {
  it('renames both legacy roles and reports the counts', async () => {
    const User = {
      updateMany: jest
        .fn()
        .mockResolvedValueOnce({ modifiedCount: 3 })
        .mockResolvedValueOnce({ modifiedCount: 2 }),
    };

    await expect(migrateLegacyRoles(User, silentLogger)).resolves.toEqual({
      developers: 3,
      professors: 2,
    });

    expect(User.updateMany).toHaveBeenCalledWith(
      { role: 'developer' },
      { $set: { role: 'user' } }
    );
    expect(User.updateMany).toHaveBeenCalledWith(
      { role: 'professor' },
      { $set: { role: 'teacher' } }
    );
  });

  it('stays quiet when there is nothing to migrate', async () => {
    const User = { updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }) };

    await migrateLegacyRoles(User, silentLogger);

    expect(silentLogger.log).not.toHaveBeenCalled();
  });
});

describe('grantSuperAdmin', () => {
  it('does not touch the collection when no emails are configured', async () => {
    const User = { updateMany: jest.fn() };

    await expect(grantSuperAdmin(User, [], silentLogger)).resolves.toEqual({ promoted: 0 });
    expect(User.updateMany).not.toHaveBeenCalled();
  });

  it('excludes suspended accounts from the grant', async () => {
    const User = { updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }) };

    await grantSuperAdmin(User, ['owner@x.com'], silentLogger);

    const [filter, update] = User.updateMany.mock.calls[0];
    expect(filter).toEqual({
      email: { $in: ['owner@x.com'] },
      status: { $ne: 'suspended' },
    });
    expect(update.$addToSet.roles.$each).toEqual(OWNER_ROLES);
  });
});

describe('bootstrapPlatformOwner', () => {
  const credentials = { email: 'owner@x.com', password: 'chosen-password', generated: false };

  it('creates the account when it is missing', async () => {
    const User = { findOne: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}) };

    await expect(bootstrapPlatformOwner(User, credentials, silentLogger)).resolves.toEqual({
      created: true,
      updated: false,
    });

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'owner@x.com',
        password: 'chosen-password',
        role: 'super_admin',
        adminId: OWNER_ADMIN_ID,
        status: 'active',
        mustChangePassword: false,
      })
    );
  });

  it('forces a password change when the password was generated for us', async () => {
    const User = { findOne: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}) };

    await bootstrapPlatformOwner(User, { ...credentials, generated: true }, silentLogger);

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ mustChangePassword: true })
    );
    expect(silentLogger.warn).toHaveBeenCalledWith(expect.stringContaining('chosen-password'));
  });

  it('never rewrites the password of an account that already exists', async () => {
    const existing = {
      status: 'active',
      roles: ['user'],
      password: 'rotated-by-the-operator',
      save: jest.fn().mockResolvedValue(undefined),
    };
    const User = { findOne: jest.fn().mockResolvedValue(existing), create: jest.fn() };

    await expect(bootstrapPlatformOwner(User, credentials, silentLogger)).resolves.toEqual({
      created: false,
      updated: true,
    });

    expect(User.create).not.toHaveBeenCalled();
    expect(existing.password).toBe('rotated-by-the-operator');
    expect(existing.roles).toEqual(expect.arrayContaining(OWNER_ROLES));
    expect(existing.adminId).toBe(OWNER_ADMIN_ID);
  });

  it('leaves a suspended owner account suspended', async () => {
    const existing = { status: 'suspended', roles: [], save: jest.fn() };
    const User = { findOne: jest.fn().mockResolvedValue(existing), create: jest.fn() };

    await expect(bootstrapPlatformOwner(User, credentials, silentLogger)).resolves.toEqual({
      created: false,
      updated: false,
    });

    expect(existing.save).not.toHaveBeenCalled();
    expect(silentLogger.warn).toHaveBeenCalledWith(expect.stringMatching(/suspended/u));
  });
});

describe('backfillMaviIds', () => {
  const buildUser = () => ({ save: jest.fn().mockResolvedValue(undefined) });

  const stubFind = (batches) => {
    let call = 0;
    return jest.fn(() => ({
      limit: jest.fn().mockResolvedValue(batches[call++] || []),
    }));
  };

  it('saves each account so the pre-save hook assigns an ID', async () => {
    const batch = [buildUser(), buildUser()];
    const User = { find: stubFind([batch]), countDocuments: jest.fn() };

    await expect(backfillMaviIds(User, silentLogger)).resolves.toEqual({
      backfilled: 2,
      remaining: 0,
    });

    for (const user of batch) expect(user.save).toHaveBeenCalled();
  });

  it('stops after a short batch instead of querying forever', async () => {
    const User = { find: stubFind([[buildUser()]]), countDocuments: jest.fn() };

    await backfillMaviIds(User, silentLogger);

    expect(User.find).toHaveBeenCalledTimes(1);
  });

  it('caps the work done in a single boot and reports the remainder', async () => {
    const fullBatch = () => Array.from({ length: MAVI_ID_BATCH_SIZE }, buildUser);
    const batches = Array.from({ length: MAVI_ID_MAX_PER_BOOT / MAVI_ID_BATCH_SIZE }, fullBatch);

    const User = {
      find: stubFind(batches),
      countDocuments: jest.fn().mockResolvedValue(500),
    };

    await expect(backfillMaviIds(User, silentLogger)).resolves.toEqual({
      backfilled: MAVI_ID_MAX_PER_BOOT,
      remaining: 500,
    });
  });

  it('does nothing when every account already has an ID', async () => {
    const User = { find: stubFind([[]]), countDocuments: jest.fn() };

    await expect(backfillMaviIds(User, silentLogger)).resolves.toEqual({
      backfilled: 0,
      remaining: 0,
    });
  });
});

describe('cleanupGoogleIdIndex', () => {
  const buildUser = (dropIndex) => ({
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 4 }),
    collection: { dropIndex },
  });

  it('clears null googleIds and drops the legacy index', async () => {
    const User = buildUser(jest.fn().mockResolvedValue(undefined));

    await expect(cleanupGoogleIdIndex(User, silentLogger)).resolves.toEqual({
      cleared: 4,
      indexDropped: true,
    });
  });

  it('treats a missing index as the steady state', async () => {
    const notFound = Object.assign(new Error('index not found with name [googleId_1]'), {
      code: 27,
    });
    const User = buildUser(jest.fn().mockRejectedValue(notFound));

    await expect(cleanupGoogleIdIndex(User, silentLogger)).resolves.toEqual({
      cleared: 4,
      indexDropped: false,
    });
  });

  it('propagates any other index error', async () => {
    const User = buildUser(jest.fn().mockRejectedValue(new Error('not authorized')));

    await expect(cleanupGoogleIdIndex(User, silentLogger)).rejects.toThrow('not authorized');
  });
});

describe('seedDefaultInstitutions', () => {
  it('inserts nothing when the collection already has rows', async () => {
    const Institution = { countDocuments: jest.fn().mockResolvedValue(2), create: jest.fn() };

    await expect(seedDefaultInstitutions(Institution, silentLogger)).resolves.toEqual({ seeded: 0 });
    expect(Institution.create).not.toHaveBeenCalled();
  });

  it('seeds an empty collection', async () => {
    const Institution = {
      countDocuments: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue([]),
    };

    await expect(seedDefaultInstitutions(Institution, silentLogger)).resolves.toEqual({ seeded: 3 });
  });

  it('uses a status the schema enum actually accepts', () => {
    // 'ACTIVE' fails validation against enum ['active', 'suspended'], which is
    // why the seed silently never worked.
    for (const institution of DEFAULT_INSTITUTIONS) {
      expect(institution.status).toBe('active');
    }
  });
});

describe('runStartupTasks', () => {
  const buildModels = () => ({
    User: {
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      find: jest.fn(() => ({ limit: jest.fn().mockResolvedValue([]) })),
      countDocuments: jest.fn().mockResolvedValue(0),
      collection: { dropIndex: jest.fn().mockResolvedValue(undefined) },
    },
    Institution: {
      countDocuments: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue([]),
    },
  });

  it('skips the institution seed unless it is opted into', async () => {
    const models = buildModels();

    await runStartupTasks({ ...models, env: { NODE_ENV: 'test' }, logger: silentLogger });

    expect(models.Institution.create).not.toHaveBeenCalled();
  });

  it('runs the institution seed when the flag is set', async () => {
    const models = buildModels();

    await runStartupTasks({
      ...models,
      env: { NODE_ENV: 'test', SEED_DEFAULT_INSTITUTIONS: 'true' },
      logger: silentLogger,
    });

    expect(models.Institution.create).toHaveBeenCalled();
  });

  it('lets a migration failure through without stopping the boot', async () => {
    const models = buildModels();
    models.User.updateMany.mockRejectedValue(new Error('replica set stepping down'));

    const results = await runStartupTasks({
      ...models,
      env: { NODE_ENV: 'test' },
      logger: silentLogger,
    });

    expect(results.legacyRoles.error).toMatch(/stepping down/u);
    expect(results.owner).toEqual({ created: true, updated: false });
  });

  it('aborts the boot when the owner account cannot be created', async () => {
    const models = buildModels();
    models.User.create.mockRejectedValue(new Error('E11000 duplicate key'));

    await expect(
      runStartupTasks({ ...models, env: { NODE_ENV: 'test' }, logger: silentLogger })
    ).rejects.toThrow(/duplicate key/u);
  });

  it('aborts the boot in production when the owner credentials are unset', async () => {
    const models = buildModels();

    await expect(
      runStartupTasks({ ...models, env: { NODE_ENV: 'production' }, logger: silentLogger })
    ).rejects.toThrow(/Refusing to start/u);

    expect(models.User.updateMany).not.toHaveBeenCalled();
  });
});
