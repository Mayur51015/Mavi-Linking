const User = require('../models/User');
const Activity = require('../models/Activity');
const { fetchUserProfile, fetchUserRepositories, fetchUserEvents } = require('./githubService');
const { normalizeGitHubIntelligence } = require('./githubIntelligenceService');

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

  try {
    // 1. Fetch from GitHub API with graceful partial handling
    let rawProfile = null;
    let rawRepos = [];
    let rawEvents = [];
    let fetchError = null;

    try {
      rawProfile = await fetchUserProfile(username);
    } catch (err) {
      fetchError = err.message;
      throw new Error(`Unable to fetch GitHub profile for "${username}": ${err.message}`);
    }

    try {
      rawRepos = await fetchUserRepositories(username, 30);
    } catch (err) {
      console.warn(`[GitHub Sync] Repos fetch warning for ${username}:`, err.message);
    }

    try {
      rawEvents = await fetchUserEvents(username, 50);
    } catch (err) {
      console.warn(`[GitHub Sync] Events fetch warning for ${username}:`, err.message);
    }

    // 2. Normalize Intelligence Data
    const githubData = normalizeGitHubIntelligence(rawProfile, rawRepos, rawEvents, username);

    // 3. Persist Activities into Activity Collection (deduplicated)
    if (rawEvents.length > 0) {
      for (const event of rawEvents) {
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
      }
    }

    // 3.5 Capture previous platform snapshot for event sourcing (pre-overwrite)
    const previousGithubData = user.platformData?.github || null;

    // 4. Update Canonical User Document
    user.platforms = user.platforms || {};    user.platforms.github = user.platforms.github || {};
    user.platforms.github.username = username;
    user.platforms.github.linkedAt = user.platforms.github.linkedAt || new Date();
    user.githubUsername = username; // Legacy mirror for backwards compatibility

    user.platformData = user.platformData || {};
    user.platformData.github = githubData;
    user.lastSyncedAt = new Date();

    await user.save();

    // 4.5 Record immutable activity events for this sync (idempotent per syncVersion)
    const { recordEvent } = require('./activityEventService');
    const syncVersion = user.lastSyncedAt.toISOString();
    const newRepoCount = githubData?.profile?.publicRepos ?? 0;
    const prevRepoCount = previousGithubData?.profile?.publicRepos ?? null;
    if (prevRepoCount === null || prevRepoCount !== newRepoCount) {
      await recordEvent({
        userId: user._id,
        platform: 'github',
        eventType: 'REPOSITORY_CHANGE',
        previousValue: { publicRepos: prevRepoCount },
        newValue: { publicRepos: newRepoCount },
        syncVersion,
      });
    }
    const newContributions = githubData?.contributions?.totalRecentEvents ?? 0;
    const prevContributions = previousGithubData?.contributions?.totalRecentEvents ?? null;
    if (prevContributions === null || prevContributions !== newContributions) {
      await recordEvent({
        userId: user._id,
        platform: 'github',
        eventType: 'CONTRIBUTION_CHANGE',
        previousValue: { totalRecentEvents: prevContributions },
        newValue: { totalRecentEvents: newContributions },
        syncVersion,
      });
    }

    // 5. Trigger Canonical Intelligence & Scoring Evaluation    const { evaluateUserIntelligence } = require('./careerIntelligenceService');
    const updatedUser = await evaluateUserIntelligence(user._id);

    return {
      success: true,
      data: githubData,
      user: updatedUser,
      message: 'GitHub intelligence synchronized successfully.',
    };
  } finally {
    syncLocks.delete(userId.toString());
  }
};

module.exports = {
  syncGitHubAccount,
};
