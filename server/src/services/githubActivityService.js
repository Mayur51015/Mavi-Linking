const Activity = require('../models/Activity');
const User = require('../models/User');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

const getGitHubUsername = (user) =>
  user?.platforms?.github?.username || user?.githubUsername || '';

const getHeaders = () => {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Mavi-Linking',
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  return headers;
};

const mapGitHubEvent = (event, userId) => {
  const repoName = event.repo?.name || 'GitHub repository';
  const repoUrl = `https://github.com/${repoName}`;

  let type = 'Other';
  let title = event.type?.replace('Event', '') || 'GitHub Activity';
  let description = `${title} in ${repoName}`;

  switch (event.type) {
    case 'PushEvent': {
      type = 'Commit';
      const commitCount = event.payload?.commits?.length || 0;
      title = `Pushed ${commitCount || 'new'} commit${commitCount === 1 ? '' : 's'}`;
      description = `Code pushed to ${repoName}`;
      break;
    }

    case 'PullRequestEvent': {
      type = 'Pull Request';
      const action = event.payload?.action || 'updated';
      const pr = event.payload?.pull_request;
      title = `${action.charAt(0).toUpperCase() + action.slice(1)} pull request`;
      description = pr?.title
        ? `${pr.title} in ${repoName}`
        : `Pull request ${action} in ${repoName}`;
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
      description = event.payload?.issue?.title
        ? `${event.payload.issue.title} in ${repoName}`
        : `Issue ${action} in ${repoName}`;
      break;
    }

    case 'ReleaseEvent': {
      type = 'Release';
      title = 'Published release';
      description = event.payload?.release?.name
        ? `${event.payload.release.name} in ${repoName}`
        : `Published a release in ${repoName}`;
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
    date: new Date(event.created_at),
  };
};

const syncGitHubActivities = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const username = getGitHubUsername(user);

  if (!username) {
    return [];
  }

  const url = `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=30`;

  const response = await fetch(url, {
    headers: getHeaders(),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Unable to fetch GitHub activity');
  }

  if (!Array.isArray(payload)) {
    return [];
  }

  const activities = [];

  for (const event of payload) {
    const mapped = mapGitHubEvent(event, userId);

    const exists = await Activity.findOne({
      userId,
      platform: 'github',
      date: mapped.date,
      title: mapped.title,
      url: mapped.url,
    });

    if (!exists) {
      const activity = await Activity.create(mapped);
      activities.push(activity);
    }
  }

  return activities;
};

module.exports = {
  syncGitHubActivities,
};
