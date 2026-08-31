const User = require('../models/User');
const Activity = require('../models/Activity');
const {
  fetchUserProfile,
  fetchUserRepositories,
  fetchUserEvents,
  fetchUserContributionsData,
} = require('./githubService');
const { normalizeGitHubIntelligence } = require('./githubIntelligenceService');
const { evaluateUserIntelligence } = require('./careerIntelligenceService');
const { recordSyncSuccess, recordSyncFailure } = require('./syncConsistencyService');
const ExternalIdentity = require('../models/ExternalIdentity');

// In-memory sync lock map to prevent overlapping sync operations
const syncLocks = new Map();

/**
 * Map raw GitHub event to Activity collection document.
 */
const mapGitHubEventToActivity = (event, userId) => {
  const repoName = event.repo?.name || 'GitHub repository';
  const repoUrl = `https://github.com/${repoName}`;

  let type = 'Other';
  let title = event.type?.replace('Event', '') || 'GitHub Activity';
  let description = `${title} in ${repoName}`;

  switch (event.type) {
    case 'PushEvent': {
      type = 'Commit';
      const commitCount = event.payload?.commits?.length || 1;
      title = `Pushed ${commitCount} commit${commitCount === 1 ? '' : 's'}`;
      description = `Code pushed to ${repoName}`;
      break;
    }

    case 'PullRequestEvent': {
      type = 'Pull Request';
      const action = event.payload?.action || 'updated';
      const pr = event.payload?.pull_request;
      title = `${action.charAt(0).toUpperCase() + action.slice(1)} pull request`;
      description = pr?.title ? `${pr.title} in ${repoName}` : `Pull request ${action} in ${repoName}`;
      break;
    }

    case 'CreateEvent': {
      if (event.payload?.ref_type === 'repository') {
        type = 'Repository';
        title = 'Created repository';
        description = `Created ${repoName}`;
      }
      break;
    }

    case 'IssuesEvent': {
      type = 'Issue';
      const action = event.payload?.action || 'updated';
      title = `${action.charAt(0).toUpperCase() + action.slice(1)} issue`;
      description = event.payload?.issue?.title ? `${event.payload.issue.title} in ${repoName}` : `Issue ${action} in ${repoName}`;
      break;
    }

    case 'ReleaseEvent': {
      type = 'Release';
      title = 'Published release';
      description = event.payload?.release?.name ? `${event.payload.release.name} in ${repoName}` : `Published a release in ${repoName}`;
      break;
    }

    case 'WatchEvent': {
      type = 'Other';
      title = 'Starred repository';
      description = `Starred ${repoName}`;
      break;
    }

    default:
      break;
  }

  return {
    userId,
    type,
    title,
    description,
    url: repoUrl,
    platform: 'github',
    date: new Date(event.created_at || Date.now()),
  };
};

/**
 * Synchronize all GitHub intelligence data for a given user.
 */
const syncGitHubAccount = async (userId, customUsername = null) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const username = (customUsername || user.platforms?.github?.username || user.githubUsername || '').trim();
  if (!username) {
    throw new Error('GitHub account is not linked. Please provide a GitHub username.');
  }

  // Prevent duplicate concurrent sync runs
  if (syncLocks.get(userId.toString())) {
    return {
      status: 'in_progress',
      message: 'GitHub synchronization is already running for this user.',
    };
  }

  syncLocks.set(userId.toString(), true);
  const startedAt = new Date();
  console.log(`[GitHub Sync] Started synchronization for user ${userId} (@${username}) at ${startedAt.toISOString()}`);

  try {
    const previousGithubData = user.platformData?.github || null;

    // 1. Fetch from GitHub API with graceful partial handling
    let rawProfile = null;
    let rawRepos = [];
    let rawEvents = [];
    let searchContributions = null;
    const partialErrors = [];

    try {
      rawProfile = await fetchUserProfile(username);
    } catch (err) {
      console.error(`[GitHub Sync] Failed to fetch profile for @${username}:`, err.message);
      // If profile fails, preserve existing data and mark failed sync
      const durationMs = Date.now() - startedAt.getTime();
      const failedSyncMeta = {
        status: 'failed',
        startedAt,
        completedAt: new Date(),
        durationMs,
        error: err.message,
      };
      if (previousGithubData) {
        user.platformData.github.sync = failedSyncMeta;
        await user.save();
      }
      throw new Error(`Unable to fetch GitHub profile for "${username}": ${err.message}`);
    }

    try {
      rawRepos = await fetchUserRepositories(username, 100);
    } catch (err) {
      console.warn(`[GitHub Sync] Repos fetch warning for @${username}:`, err.message);
      partialErrors.push(`Repositories: ${err.message}`);
    }

    try {
      rawEvents = await fetchUserEvents(username, 100);
    } catch (err) {
      console.warn(`[GitHub Sync] Events fetch warning for @${username}:`, err.message);
      partialErrors.push(`Events: ${err.message}`);
    }

    try {
      searchContributions = await fetchUserContributionsData(username);
    } catch (err) {
      console.warn(`[GitHub Sync] Contributions search warning for @${username}:`, err.message);
    }

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const syncStatus = partialErrors.length > 0 ? 'partial' : 'complete';

    const syncMeta = {
      status: syncStatus,
      startedAt,
      completedAt,
      durationMs,
      error: partialErrors.length > 0 ? partialErrors.join(' | ') : null,
    };

    // 2. Normalize Intelligence Data (merging with previous data and search metrics)
    const githubData = normalizeGitHubIntelligence(
      rawProfile,
      rawRepos,
      rawEvents,
      username,
      previousGithubData,
      syncMeta,
      searchContributions
    );

    // 3. Persist Activities into Activity Collection (deduplicated)
    if (rawEvents.length > 0) {
      for (const event of rawEvents) {
        try {
          const mapped = mapGitHubEventToActivity(event, user._id);
          const exists = await Activity.findOne({
            userId: user._id,
            platform: 'github',
            date: mapped.date,
            title: mapped.title,
            url: mapped.url,
          });

          if (!exists) {
            await Activity.create(mapped);
          }
        } catch (actErr) {
          console.warn('[GitHub Sync] Activity record insertion warning:', actErr.message);
        }
      }
    }

    // 4. Update Canonical User Document
    user.platforms = user.platforms || {};
    user.platforms.github = user.platforms.github || {};
    user.platforms.github.username = username;
    user.platforms.github.linkedAt = user.platforms.github.linkedAt || new Date();
    user.githubUsername = username; // Legacy mirror for backwards compatibility

    user.platformData = user.platformData || {};
    user.platformData.github = githubData;
    user.lastSyncedAt = completedAt;

    recordSyncSuccess(user, 'github', githubData);
    await user.save();

    // 5. Evaluate Career Intelligence, Scores & Developer DNA
    const updatedUser = await evaluateUserIntelligence(user._id);

    return {
      success: true,
      status: syncStatus,
      durationMs,
      data: githubData,
      user: updatedUser || user,
      message: syncStatus === 'partial' 
        ? 'GitHub synchronized partially (some endpoints unavailable).'
        : 'GitHub intelligence synchronized successfully.',
    };
  } catch (error) {
    try {
      const failedUser = await User.findById(userId);
      if (failedUser) {
        recordSyncFailure(failedUser, 'github', error);
        await failedUser.save();
      }
    } catch (metadataError) {
      console.error('[GitHub Sync] Failed to record sync metadata:', metadataError.message);
    }

    throw error;
  } finally {
    syncLocks.delete(userId.toString());
  }
};

module.exports = {
  syncGitHubAccount,
};

