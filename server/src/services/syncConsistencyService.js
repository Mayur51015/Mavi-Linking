const crypto = require('crypto');

const FRESHNESS_WINDOWS = {
  fresh: 24 * 60 * 60 * 1000,
  stale: 7 * 24 * 60 * 60 * 1000,
};

const PLATFORMS = ['github', 'codeforces', 'leetcode', 'stackoverflow'];

const createEmptyMetadata = () => ({
  lastSuccessfulSyncAt: null,
  lastAttemptedSyncAt: null,
  dataVersion: null,
  syncStatus: 'failed',
  failureReason: null,
  sourceResponseTimestamp: null,
  consecutiveFailures: 0,
  freshnessState: 'unavailable',
});

const stableStringify = (value) => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  return `{${Object.keys(value)
    .filter((key) => !['fetchedAt', 'lastUpdated', 'sync'].includes(key))
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
};

const createDataVersion = (data) =>
  crypto
    .createHash('sha256')
    .update(stableStringify(data))
    .digest('hex');

const getFreshnessState = (lastSuccessfulSyncAt, now = Date.now()) => {
  if (!lastSuccessfulSyncAt) {
    return 'unavailable';
  }

  const age = now - new Date(lastSuccessfulSyncAt).getTime();

  if (age <= FRESHNESS_WINDOWS.fresh) {
    return 'fresh';
  }

  return 'stale';
};

const extractSourceResponseTimestamp = (data) =>
  data?.sourceResponseTimestamp ||
  data?.sourceResponseAt ||
  data?.updatedAt ||
  data?.profile?.updatedAt ||
  data?.sync?.sourceResponseTimestamp ||
  null;

const ensurePlatformSyncMetadata = (user) => {
  user.platformSync = user.platformSync || {};

  for (const platform of PLATFORMS) {
    user.platformSync[platform] =
      user.platformSync[platform] || createEmptyMetadata();
  }

  return user.platformSync;
};

const recordSyncSuccess = (user, platform, data) => {
  ensurePlatformSyncMetadata(user);

  const now = new Date();
  const metadata = user.platformSync[platform];
  const dataVersion = createDataVersion(data);
  const dataChanged = metadata.dataVersion !== dataVersion;

  metadata.lastSuccessfulSyncAt = now;
  metadata.lastAttemptedSyncAt = now;
  metadata.dataVersion = dataVersion;
  metadata.syncStatus = 'success';
  metadata.failureReason = null;
  metadata.sourceResponseTimestamp =
    extractSourceResponseTimestamp(data);
  metadata.consecutiveFailures = 0;
  metadata.freshnessState = 'fresh';

  if (dataChanged) {
    user.platformData = user.platformData || {};
    user.platformData[platform] = data;
  }

  user.lastSyncedAt = now;

  return {
    dataChanged,
    metadata,
  };
};

const recordSyncFailure = (user, platform, error) => {
  ensurePlatformSyncMetadata(user);

  const now = new Date();
  const metadata = user.platformSync[platform];

  metadata.lastAttemptedSyncAt = now;
  metadata.syncStatus = 'failed';
  metadata.failureReason = error?.message || String(error);
  metadata.consecutiveFailures =
    (metadata.consecutiveFailures || 0) + 1;
  metadata.freshnessState = getFreshnessState(
    metadata.lastSuccessfulSyncAt,
    now.getTime()
  );

  return metadata;
};

const getPlatformFreshness = (user, platform) => {
  ensurePlatformSyncMetadata(user);

  const metadata = user.platformSync[platform];
  const freshnessState = getFreshnessState(
    metadata.lastSuccessfulSyncAt
  );

  return {
    ...metadata.toObject?.() || metadata,
    freshnessState,
  };
};

const getProfileFreshness = (user) => {
  const platforms = {};

  for (const platform of PLATFORMS) {
    const linked = !!user.platforms?.[platform]?.username;

    platforms[platform] = {
      linked,
      ...(getPlatformFreshness(user, platform)),
    };
  }

  const linkedStates = Object.values(platforms)
    .filter((platform) => platform.linked)
    .map((platform) => platform.freshnessState);

  let overallState = 'unavailable';

  if (linkedStates.length > 0) {
    if (linkedStates.every((state) => state === 'fresh')) {
      overallState = 'current';
    } else if (linkedStates.every((state) => state === 'unavailable')) {
      overallState = 'unavailable';
    } else {
      overallState = 'partially_stale';
    }
  }

  return {
    state: overallState,
    platforms,
    linkedPlatforms: linkedStates.length,
    freshPlatforms: linkedStates.filter(
      (state) => state === 'fresh'
    ).length,
    stalePlatforms: linkedStates.filter(
      (state) => state === 'stale'
    ).length,
    unavailablePlatforms: linkedStates.filter(
      (state) => state === 'unavailable'
    ).length,
  };
};

module.exports = {
  PLATFORMS,
  createDataVersion,
  getFreshnessState,
  recordSyncSuccess,
  recordSyncFailure,
  getPlatformFreshness,
  getProfileFreshness,
};