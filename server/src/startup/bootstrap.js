const crypto = require('crypto');

/**
 * Startup bootstrap — role migrations, the platform owner account, and the
 * optional demo institution seed.
 *
 * This used to live inline in `startServer()`, which meant none of it could be
 * tested and a failure anywhere in it was swallowed by a single `console.warn`.
 * Everything here is exported so the decisions (which accounts get elevated,
 * what password the owner gets) can be asserted on directly, and the callers
 * below distinguish between a task that may fail and one that must not.
 */

const OWNER_ADMIN_ID = 'MAVI-OWNER-001';
const OWNER_MAVI_ID = 'MAVI-OWNER01';
const OWNER_DESIGNATION = 'Platform Owner & Founder';
const OWNER_ROLES = ['super_admin', 'admin', 'user'];

// Backfilling every account that predates the MAVI ID scheme is a one-time
// migration, but it runs on every boot. Walk it in batches so a large
// collection doesn't get pulled into memory all at once, and stop after this
// many documents so a boot can't be held hostage by it — the next boot picks
// up where this one left off.
const MAVI_ID_BATCH_SIZE = 100;
const MAVI_ID_MAX_PER_BOOT = 1000;

const noopLogger = { log: () => {}, warn: () => {}, error: () => {} };

/**
 * Split a comma- or whitespace-separated env value into normalised emails.
 * Anything without an `@` is dropped rather than silently used as a query
 * value, since these strings feed straight into a privilege grant.
 */
const parseEmailList = (raw) => {
  if (!raw || typeof raw !== 'string') return [];

  const seen = new Set();
  for (const part of raw.split(/[,\s;]+/u)) {
    const email = part.trim().toLowerCase();
    if (email.includes('@') && email.length > 2) {
      seen.add(email);
    }
  }

  return [...seen];
};

/**
 * Generate a random password for local development, so a developer who has
 * not configured OWNER_PASSWORD still gets a usable account — just not one
 * whose password is the same on every machine and every fork.
 */
const generatePassword = () =>
  `Mavi-${crypto.randomBytes(18).toString('base64url')}!1`;

/**
 * Resolve the credentials for the platform owner account.
 *
 * In production both values must come from the environment. Falling back to a
 * literal here would put the credentials for an account that clears
 * `requireOwner`, `requireSuperAdmin` and `requireAdmin` into a public
 * repository, so a missing value is a hard boot failure instead.
 */
const resolveOwnerCredentials = (env = process.env) => {
  const isProduction = env.NODE_ENV === 'production';
  const email = (env.OWNER_EMAIL || '').trim().toLowerCase();
  const password = env.OWNER_PASSWORD || '';

  if (isProduction) {
    const missing = [];
    if (!email) missing.push('OWNER_EMAIL');
    if (!password) missing.push('OWNER_PASSWORD');

    if (missing.length > 0) {
      throw new Error(
        `Refusing to start: ${missing.join(' and ')} must be set in production. ` +
          'The platform owner account has unrestricted access to every tenant, so it ' +
          'cannot be seeded from a default baked into the source tree.'
      );
    }

    if (password.length < 12) {
      throw new Error(
        'Refusing to start: OWNER_PASSWORD must be at least 12 characters.'
      );
    }

    return { email, password, generated: false };
  }

  return {
    email: email || 'owner@mavilinking.local',
    password: password || generatePassword(),
    generated: !password,
  };
};

/**
 * Accounts to grant super_admin to, read only from the environment.
 *
 * Previously this was a literal array of five personal Gmail addresses. Two of
 * them were generic enough to be registerable by anyone, and because the grant
 * was an `updateMany` re-run on every boot, registering one of those addresses
 * was a self-service route to super_admin — and an administrator could never
 * demote such an account, because the next restart put the role back.
 */
const resolveSuperAdminEmails = (env = process.env) =>
  parseEmailList([env.SUPER_ADMIN_EMAILS, env.SUPER_ADMIN_EMAIL].filter(Boolean).join(','));

const shouldSeedInstitutions = (env = process.env) =>
  String(env.SEED_DEFAULT_INSTITUTIONS || '').toLowerCase() === 'true';

/**
 * Rename the two legacy role values in place. Idempotent and cheap — both are
 * indexed equality updates that match nothing once the migration has run.
 */
const migrateLegacyRoles = async (User, logger = noopLogger) => {
  const [devMigrated, profMigrated] = await Promise.all([
    User.updateMany({ role: 'developer' }, { $set: { role: 'user' } }),
    User.updateMany({ role: 'professor' }, { $set: { role: 'teacher' } }),
  ]);

  const developers = devMigrated.modifiedCount || 0;
  const professors = profMigrated.modifiedCount || 0;

  if (developers > 0 || professors > 0) {
    logger.log(`   ✅ Role migration: ${developers} developer→user, ${professors} professor→teacher`);
  }

  return { developers, professors };
};

/**
 * Grant super_admin to the configured addresses.
 *
 * Suspended accounts are skipped: re-elevating an account an administrator
 * deliberately locked out is the opposite of what a boot task should do.
 */
const grantSuperAdmin = async (User, emails, logger = noopLogger) => {
  if (emails.length === 0) return { promoted: 0 };

  const result = await User.updateMany(
    { email: { $in: emails }, status: { $ne: 'suspended' } },
    {
      $set: { role: 'super_admin' },
      $addToSet: { roles: { $each: OWNER_ROLES } },
    }
  );

  const promoted = result.modifiedCount || 0;
  if (promoted > 0) {
    logger.log(`   ✅ Granted super_admin to ${promoted} configured account(s).`);
  }

  return { promoted };
};

/**
 * Create the platform owner account if it is missing, and keep its
 * administrative identifiers in sync if it already exists.
 *
 * The password is only ever set at creation time. Re-applying it on every boot
 * would undo a rotation performed through the UI, and would mean the value in
 * the environment stays live forever.
 */
const bootstrapPlatformOwner = async (User, credentials, logger = noopLogger) => {
  const { email, password, generated } = credentials;

  const existing = await User.findOne({ email });

  if (!existing) {
    await User.create({
      name: 'Platform Owner',
      email,
      password,
      role: 'super_admin',
      roles: [...OWNER_ROLES],
      adminId: OWNER_ADMIN_ID,
      adminLoginId: OWNER_ADMIN_ID,
      designation: OWNER_DESIGNATION,
      maviId: OWNER_MAVI_ID,
      status: 'active',
      emailVerified: true,
      // A password this process invented is not a password the operator chose.
      // Force it to be replaced at first login rather than leaving it valid.
      mustChangePassword: generated,
    });

    logger.log(`   👑 Platform owner account created: ${email} (${OWNER_ADMIN_ID})`);
    if (generated) {
      logger.warn(
        `   🔑 OWNER_PASSWORD was not set — generated a one-time password for this account:\n      ${password}\n` +
          '      It must be changed at first login. Set OWNER_PASSWORD to choose your own.'
      );
    }

    return { created: true, updated: false };
  }

  if (existing.status === 'suspended') {
    logger.warn(
      `   ⚠️  Platform owner account ${email} is suspended — leaving it alone. ` +
        'Reactivate it through the admin UI if this is not intentional.'
    );
    return { created: false, updated: false };
  }

  existing.role = 'super_admin';
  for (const role of OWNER_ROLES) {
    if (!existing.roles.includes(role)) existing.roles.push(role);
  }
  existing.adminId = OWNER_ADMIN_ID;
  existing.adminLoginId = OWNER_ADMIN_ID;
  existing.designation = OWNER_DESIGNATION;
  await existing.save();

  return { created: false, updated: true };
};

/**
 * Give accounts created before the MAVI ID scheme an ID. The value itself is
 * produced by the model's pre-save hook, so this only has to re-save them.
 */
const backfillMaviIds = async (User, logger = noopLogger) => {
  const query = {
    $or: [{ maviId: { $exists: false } }, { maviId: null }, { maviId: '' }],
  };

  let backfilled = 0;
  let remaining = 0;

  while (backfilled < MAVI_ID_MAX_PER_BOOT) {
    const batch = await User.find(query).limit(MAVI_ID_BATCH_SIZE);
    if (batch.length === 0) break;

    for (const user of batch) {
      await user.save();
      backfilled += 1;
    }

    if (batch.length < MAVI_ID_BATCH_SIZE) break;
  }

  if (backfilled >= MAVI_ID_MAX_PER_BOOT) {
    remaining = await User.countDocuments(query);
  }

  if (backfilled > 0) {
    logger.log(`   ✅ MAVI ID backfill: ${backfilled} account(s) updated.`);
  }
  if (remaining > 0) {
    logger.warn(`   ⚠️  MAVI ID backfill: ${remaining} account(s) left for the next boot.`);
  }

  return { backfilled, remaining };
};

/**
 * `googleId: null` on multiple documents collides under the old non-sparse
 * unique index, which blocks Google sign-up entirely. Clear the nulls and drop
 * the index so Mongoose can rebuild it from the current schema.
 */
const cleanupGoogleIdIndex = async (User, logger = noopLogger) => {
  const cleanup = await User.updateMany({ googleId: null }, { $unset: { googleId: 1 } });
  const cleared = cleanup.modifiedCount || 0;

  if (cleared > 0) {
    logger.log(`   ✅ Cleared googleId: null on ${cleared} account(s).`);
  }

  let indexDropped = false;
  try {
    await User.collection.dropIndex('googleId_1');
    indexDropped = true;
    logger.log('   ✅ Dropped the legacy googleId_1 index so it rebuilds as sparse.');
  } catch (error) {
    // IndexNotFound (27) is the steady state once this has run once.
    if (error.code !== 27 && !/index not found/iu.test(error.message || '')) {
      throw error;
    }
  }

  return { cleared, indexDropped };
};

const DEFAULT_INSTITUTIONS = [
  {
    name: 'Zeal College of Engineering and Research',
    tenantId: 'INST-ZEAL-001',
    code: 'ZEAL',
    domain: 'zeal.edu.in',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    // Lowercase: the schema enum is ['active', 'suspended']. This was 'ACTIVE',
    // so every seed attempt threw a ValidationError that the old catch-all
    // swallowed as a warning — the seed has never actually inserted anything.
    status: 'active',
    plan: 'ENTERPRISE',
    contactEmail: 'admin@zeal.edu.in',
  },
  {
    name: 'College of Engineering Pune (COEP Tech)',
    tenantId: 'INST-COEP-001',
    code: 'COEP',
    domain: 'coep.org.in',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    status: 'active',
    plan: 'ENTERPRISE',
    contactEmail: 'admin@coep.org.in',
  },
  {
    name: 'MIT World Peace University',
    tenantId: 'INST-MIT-001',
    code: 'MITWPU',
    domain: 'mitwpu.edu.in',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    status: 'active',
    plan: 'PRO',
    contactEmail: 'admin@mitwpu.edu.in',
  },
];

/**
 * Seed three sample institutions into an empty database. Opt-in, because
 * inserting named real institutions into whatever database happens to be empty
 * — a fresh developer machine, a CI run, a new production cluster — is not a
 * reasonable default.
 */
const seedDefaultInstitutions = async (Institution, logger = noopLogger) => {
  const count = await Institution.countDocuments();
  if (count > 0) return { seeded: 0 };

  await Institution.create(DEFAULT_INSTITUTIONS);
  logger.log(`   🏫 Seeded ${DEFAULT_INSTITUTIONS.length} default institutions.`);

  return { seeded: DEFAULT_INSTITUTIONS.length };
};

/**
 * Run every startup task.
 *
 * Failures are handled per task rather than by one catch around the lot. The
 * owner bootstrap is load-bearing — if it fails the server has no way in, so
 * the error propagates and the boot aborts. The migrations and the seed are
 * best-effort: they log and let the server come up.
 */
const runStartupTasks = async ({ User, Institution, env = process.env, logger = console }) => {
  const results = {};

  const credentials = resolveOwnerCredentials(env);

  const optional = [
    ['legacyRoles', () => migrateLegacyRoles(User, logger)],
    ['superAdmins', () => grantSuperAdmin(User, resolveSuperAdminEmails(env), logger)],
  ];

  for (const [name, task] of optional) {
    try {
      results[name] = await task();
    } catch (error) {
      logger.warn(`   ⚠️  Startup task "${name}" failed: ${error.message}`);
      results[name] = { error: error.message };
    }
  }

  // Not wrapped: a server whose owner account is missing or broken is not a
  // server anyone can administer, and starting anyway just hides that.
  results.owner = await bootstrapPlatformOwner(User, credentials, logger);

  const rest = [
    ['maviIds', () => backfillMaviIds(User, logger)],
    ['googleId', () => cleanupGoogleIdIndex(User, logger)],
  ];

  if (shouldSeedInstitutions(env)) {
    rest.push(['institutions', () => seedDefaultInstitutions(Institution, logger)]);
  }

  for (const [name, task] of rest) {
    try {
      results[name] = await task();
    } catch (error) {
      logger.warn(`   ⚠️  Startup task "${name}" failed: ${error.message}`);
      results[name] = { error: error.message };
    }
  }

  return results;
};

module.exports = {
  OWNER_ADMIN_ID,
  OWNER_MAVI_ID,
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
};
