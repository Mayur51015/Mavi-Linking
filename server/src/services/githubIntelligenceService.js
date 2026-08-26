/**
 * GitHub Developer Intelligence Normalizer & Analytics Engine
 * Converts raw GitHub API data into structured, explainable intelligence metrics.
 */

const normalizeGitHubIntelligence = (rawProfile, rawRepos = [], rawEvents = [], username = '') => {
  const canonicalUsername = rawProfile?.login || username;

  // 1. Profile Intelligence
  const profile = {
    username: canonicalUsername,
    name: rawProfile?.name || null,
    avatarUrl: rawProfile?.avatar_url || null,
    bio: rawProfile?.bio || null,
    company: rawProfile?.company || null,
    location: rawProfile?.location || null,
    profileUrl: rawProfile?.html_url || `https://github.com/${canonicalUsername}`,
    followers: rawProfile?.followers || 0,
    following: rawProfile?.following || 0,
    publicRepos: rawProfile?.public_repos || rawRepos.length || 0,
    accountCreatedAt: rawProfile?.created_at || null,
    accountAgeYears: rawProfile?.created_at
      ? Math.max(0, Math.round((Date.now() - new Date(rawProfile.created_at).getTime()) / (365.25 * 86400000) * 10) / 10)
      : null,
  };

  // 2. Repository Intelligence
  const repositories = rawRepos.map((r) => ({
    name: r.name,
    fullName: r.full_name || `${canonicalUsername}/${r.name}`,
    description: r.description || '',
    url: r.html_url || `https://github.com/${canonicalUsername}/${r.name}`,
    owner: r.owner?.login || canonicalUsername,
    isFork: Boolean(r.fork),
    language: r.language || 'Unspecified',
    topics: Array.isArray(r.topics) ? r.topics : [],
    stars: r.stargazers_count || 0,
    forks: r.forks_count || 0,
    openIssues: r.open_issues_count || 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    isArchived: Boolean(r.archived),
    defaultBranch: r.default_branch || 'main',
  }));

  // 3. Language Intelligence (Dynamic Repository Language Distribution)
  const languageCounts = {};
  let totalTrackedRepos = 0;

  repositories.forEach((repo) => {
    if (repo.language && repo.language !== 'Unspecified') {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      totalTrackedRepos++;
    }
  });

  const languageDistribution = {};
  const sortedLanguages = Object.entries(languageCounts).sort((a, b) => b[1] - a[1]);

  sortedLanguages.forEach(([lang, count]) => {
    const percentage = totalTrackedRepos > 0 ? Math.round((count / totalTrackedRepos) * 100) : 0;
    languageDistribution[lang] = {
      count,
      percentage,
    };
  });

  const primaryLanguages = sortedLanguages.slice(0, 5).map(([lang]) => lang);
  const languageDiversityScore = Math.min(Object.keys(languageCounts).length * 15, 100);

  const languages = {
    totalDistinct: Object.keys(languageCounts).length,
    distribution: languageDistribution,
    primaryLanguages,
    diversityScore: languageDiversityScore,
  };

  // 4. Activity & Events Analytics
  const eventCountsByType = {};
  let recentCommitCount = 0;
  const commitsByRepo = {};
  const activeDaysSet = new Set();

  let prsOpened = 0;
  let prsMerged = 0;
  let prsClosed = 0;
  let reviewsSubmitted = 0;
  let issuesCreated = 0;
  let issuesClosed = 0;
  let releaseCount = 0;
  let latestRelease = null;

  const externalReposSet = new Set();
  let externalPRCount = 0;
  let externalIssueCount = 0;

  rawEvents.forEach((ev) => {
    const eventType = ev.type || 'Other';
    eventCountsByType[eventType] = (eventCountsByType[eventType] || 0) + 1;

    if (ev.created_at) {
      activeDaysSet.add(new Date(ev.created_at).toISOString().split('T')[0]);
    }

    const repoFullName = ev.repo?.name || '';
    const repoOwner = repoFullName.split('/')[0]?.toLowerCase();
    const isExternal = repoOwner && repoOwner !== canonicalUsername.toLowerCase();

    if (isExternal) {
      externalReposSet.add(repoFullName);
    }

    if (eventType === 'PushEvent') {
      const commitCount = ev.payload?.commits?.length || 1;
      recentCommitCount += commitCount;
      if (repoFullName) {
        commitsByRepo[repoFullName] = (commitsByRepo[repoFullName] || 0) + commitCount;
      }
    } else if (eventType === 'PullRequestEvent') {
      const action = ev.payload?.action;
      const isMerged = Boolean(ev.payload?.pull_request?.merged);

      if (action === 'opened') prsOpened++;
      if (action === 'closed') {
        prsClosed++;
        if (isMerged) prsMerged++;
      }

      if (isExternal) externalPRCount++;
    } else if (eventType === 'PullRequestReviewEvent' || eventType === 'PullRequestReviewCommentEvent') {
      reviewsSubmitted++;
    } else if (eventType === 'IssuesEvent') {
      const action = ev.payload?.action;
      if (action === 'opened') issuesCreated++;
      if (action === 'closed') issuesClosed++;
      if (isExternal) externalIssueCount++;
    } else if (eventType === 'ReleaseEvent') {
      releaseCount++;
      if (!latestRelease && ev.payload?.release) {
        latestRelease = {
          name: ev.payload.release.name || ev.payload.release.tag_name,
          tagName: ev.payload.release.tag_name,
          publishedAt: ev.payload.release.published_at || ev.created_at,
          repo: repoFullName,
        };
      }
    }
  });

  // Calculate daily streak from active days
  const sortedActiveDays = Array.from(activeDaysSet).sort().reverse();
  let dailyStreak = 0;
  if (sortedActiveDays.length > 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (sortedActiveDays[0] === todayStr || sortedActiveDays[0] === yesterdayStr) {
      let checkDate = new Date(sortedActiveDays[0]);
      for (const day of sortedActiveDays) {
        if (day === checkDate.toISOString().split('T')[0]) {
          dailyStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  // 5. Commit Intelligence
  const commits = {
    recentCount30Days: recentCommitCount,
    activeRepositoriesCount: Object.keys(commitsByRepo).length,
    commitsByRepo,
    status: rawEvents.length > 0 ? 'active' : 'no_recent_events',
  };

  // 6. Pull Request Intelligence
  const totalCompletedPRs = prsClosed + prsMerged;
  const mergeRate = totalCompletedPRs > 0 ? Math.round((prsMerged / totalCompletedPRs) * 100) : null;

  const pullRequests = {
    opened: prsOpened,
    closed: prsClosed,
    merged: prsMerged,
    mergeRate: mergeRate !== null ? `${mergeRate}%` : 'Insufficient data',
    externalPRs: externalPRCount,
    status: rawEvents.length > 0 ? 'available' : 'insufficient_data',
  };

  // 7. Open Source Intelligence
  const openSource = {
    externalReposContributed: externalReposSet.size,
    externalReposList: Array.from(externalReposSet),
    externalPRs: externalPRCount,
    externalIssues: externalIssueCount,
    status: externalReposSet.size > 0 ? 'contributor' : 'personal_focus',
  };

  // 8. Reviews & Collaboration
  const reviews = {
    submitted: reviewsSubmitted,
    status: reviewsSubmitted > 0 ? 'active' : 'none_recorded',
  };

  // 9. Issues Intelligence
  const issues = {
    created: issuesCreated,
    closed: issuesClosed,
    status: (issuesCreated + issuesClosed) > 0 ? 'active' : 'none_recorded',
  };

  // 10. Software Delivery & Releases
  const releases = {
    count: releaseCount,
    latestRelease,
    status: releaseCount > 0 ? 'active' : 'none_recorded',
  };

  // 11. Contributions Summary
  const contributions = {
    totalRecentEvents: rawEvents.length,
    dailyStreak,
    activeDaysRecorded: activeDaysSet.size,
    status: rawEvents.length > 0 ? 'available' : 'unavailable',
  };

  return {
    profile,
    repositories,
    languages,
    commits,
    contributions,
    pullRequests,
    reviews,
    issues,
    openSource,
    releases,
    activity: {
      eventCountsByType,
      lastActiveAt: rawEvents[0]?.created_at || null,
      consistencyScore: Math.min(activeDaysSet.size * 10, 100),
    },
    sync: {
      lastSyncedAt: new Date(),
      status: 'complete',
      error: null,
    },
  };
};

module.exports = {
  normalizeGitHubIntelligence,
};
