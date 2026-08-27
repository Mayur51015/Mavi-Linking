const User = require('../src/models/User');
const {
  createDataVersion,
  recordSyncSuccess,
  recordSyncFailure,
  getProfileFreshness,
} = require('../src/services/syncConsistencyService');

const buildUser = () =>
  new User({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password',
    platforms: {
      github: {
        username: 'test-github',
        linkedAt: new Date(),
      },
      leetcode: {
        username: 'test-leetcode',
        linkedAt: new Date(),
      },
      codeforces: {
        username: '',
        linkedAt: null,
      },
      stackoverflow: {
        username: '',
        linkedAt: null,
      },
    },
  });

describe('Synchronization consistency', () => {
  it('tracks independent synchronization metadata for each platform', () => {
    const user = buildUser();

    recordSyncSuccess(user, 'github', {
      followers: 10,
      publicRepos: 5,
    });

    recordSyncSuccess(user, 'leetcode', {
      solved: 100,
    });

    expect(user.platformSync.github.lastSuccessfulSyncAt).toBeTruthy();
    expect(user.platformSync.leetcode.lastSuccessfulSyncAt).toBeTruthy();
    expect(user.platformSync.github.dataVersion).not.toBe(
      user.platformSync.leetcode.dataVersion
    );
  });

  it('keeps the last known good dataset after a synchronization failure', () => {
    const user = buildUser();

    const goodData = {
      solved: 100,
      ranking: 50000,
    };

    recordSyncSuccess(user, 'leetcode', goodData);

    recordSyncFailure(
      user,
      'leetcode',
      new Error('LeetCode service unavailable')
    );

    expect(user.platformData.leetcode).toEqual(goodData);
    expect(user.platformSync.leetcode.syncStatus).toBe('failed');
    expect(user.platformSync.leetcode.failureReason).toBe(
      'LeetCode service unavailable'
    );
    expect(user.platformSync.leetcode.consecutiveFailures).toBe(1);
  });

  it('marks an aggregated profile as partially stale after one platform fails', () => {
    const user = buildUser();

    recordSyncSuccess(user, 'github', {
      publicRepos: 10,
    });

    recordSyncSuccess(user, 'leetcode', {
      solved: 100,
    });

    recordSyncFailure(
      user,
      'leetcode',
      new Error('Temporary API failure')
    );

    const freshness = getProfileFreshness(user);

    expect(freshness.state).toBe('current');

    user.platformSync.leetcode.lastSuccessfulSyncAt = new Date(
      Date.now() - (8 * 24 * 60 * 60 * 1000)
    );

    const staleFreshness = getProfileFreshness(user);

    expect(staleFreshness.state).toBe('partially_stale');
    expect(staleFreshness.freshPlatforms).toBe(1);
    expect(staleFreshness.stalePlatforms).toBe(1);
  });

  it('recovers freshness after a successful synchronization', () => {
    const user = buildUser();

    recordSyncSuccess(user, 'github', {
      publicRepos: 10,
    });

    recordSyncFailure(
      user,
      'github',
      new Error('Temporary API failure')
    );

    user.platformSync.github.lastSuccessfulSyncAt = new Date(
      Date.now() - (8 * 24 * 60 * 60 * 1000)
    );

    expect(getProfileFreshness(user).state).toBe('partially_stale');

    recordSyncSuccess(user, 'github', {
      publicRepos: 12,
    });

    expect(user.platformSync.github.syncStatus).toBe('success');
    expect(user.platformSync.github.consecutiveFailures).toBe(0);
    expect(user.platformSync.github.freshnessState).toBe('fresh');
  });

  it('does not create a different data version for unchanged data', () => {
    const data = {
      solved: 100,
      ranking: 50000,
    };

    expect(createDataVersion(data)).toBe(createDataVersion(data));
  });
});