const { normalizeGitHubIntelligence } = require('../src/services/githubIntelligenceService');

describe('GitHub Developer Intelligence Unit Tests', () => {
  const mockUsername = 'octocat';

  const mockProfile = {
    login: 'octocat',
    name: 'The Octocat',
    avatar_url: 'https://avatars.githubusercontent.com/u/583231',
    bio: 'GitHub mascot',
    public_repos: 8,
    followers: 4000,
    following: 9,
    created_at: '2011-01-25T18:44:36Z',
  };

  const mockRepos = [
    {
      name: 'Hello-World',
      full_name: 'octocat/Hello-World',
      owner: { login: 'octocat' },
      language: 'JavaScript',
      stargazers_count: 1500,
      forks_count: 500,
      open_issues_count: 2,
    },
    {
      name: 'Spoon-Knife',
      full_name: 'octocat/Spoon-Knife',
      owner: { login: 'octocat' },
      language: 'HTML',
      stargazers_count: 800,
      forks_count: 200,
      open_issues_count: 0,
    },
  ];

  test('PRs opened, merged, and merge rate with valid data (10 opened, 6 merged -> 60%)', () => {
    const searchContributions = {
      prsOpened: 10,
      prsMerged: 6,
      reviewsSubmitted: 4,
      externalPRs: 3,
      externalIssues: 2,
      externalRepos: ['facebook/react', 'vercel/next.js'],
    };

    const result = normalizeGitHubIntelligence(
      mockProfile,
      mockRepos,
      [],
      mockUsername,
      null,
      {},
      searchContributions
    );

    expect(result.pullRequests.opened).toBe(10);
    expect(result.pullRequests.merged).toBe(6);
    expect(result.pullRequests.mergeRate).toBe('60%');
    expect(result.reviews.submitted).toBe(4);
    expect(result.openSource.externalPRs).toBe(3);
    expect(result.openSource.externalIssues).toBe(2);
    expect(result.openSource.externalReposContributed).toBe(2);
  });

  test('PRs opened 0 and merged 0 handles division by zero without NaN, Infinity, or undefined', () => {
    const searchContributions = {
      prsOpened: 0,
      prsMerged: 0,
      reviewsSubmitted: 0,
      externalPRs: 0,
      externalIssues: 0,
      externalRepos: [],
    };

    const result = normalizeGitHubIntelligence(
      mockProfile,
      mockRepos,
      [],
      mockUsername,
      null,
      {},
      searchContributions
    );

    expect(result.pullRequests.opened).toBe(0);
    expect(result.pullRequests.merged).toBe(0);
    expect(result.pullRequests.mergeRate).toBe('0%');
    expect(result.pullRequests.mergeRate).not.toContain('NaN');
    expect(result.pullRequests.mergeRate).not.toContain('undefined');
  });

  test('Example test case: 10 opened, 7 merged -> 70%', () => {
    const searchContributions = {
      prsOpened: 10,
      prsMerged: 7,
      reviewsSubmitted: 2,
      externalPRs: 4,
      externalIssues: 1,
      externalRepos: ['expressjs/express'],
    };

    const result = normalizeGitHubIntelligence(
      mockProfile,
      mockRepos,
      [],
      mockUsername,
      null,
      {},
      searchContributions
    );

    expect(result.pullRequests.opened).toBe(10);
    expect(result.pullRequests.merged).toBe(7);
    expect(result.pullRequests.mergeRate).toBe('70%');
  });

  test('Closed PR is NOT counted as merged unless merged == true', () => {
    const rawEvents = [
      {
        type: 'PullRequestEvent',
        payload: {
          action: 'opened',
          pull_request: { id: 101, merged: false },
        },
        repo: { name: 'octocat/Hello-World' },
        created_at: '2026-08-01T10:00:00Z',
      },
      {
        type: 'PullRequestEvent',
        payload: {
          action: 'closed',
          pull_request: { id: 101, merged: false }, // Closed without merging!
        },
        repo: { name: 'octocat/Hello-World' },
        created_at: '2026-08-02T10:00:00Z',
      },
      {
        type: 'PullRequestEvent',
        payload: {
          action: 'opened',
          pull_request: { id: 102, merged: false },
        },
        repo: { name: 'octocat/Hello-World' },
        created_at: '2026-08-03T10:00:00Z',
      },
      {
        type: 'PullRequestEvent',
        payload: {
          action: 'closed',
          pull_request: { id: 102, merged: true }, // Merged!
        },
        repo: { name: 'octocat/Hello-World' },
        created_at: '2026-08-04T10:00:00Z',
      },
    ];

    const result = normalizeGitHubIntelligence(
      mockProfile,
      mockRepos,
      rawEvents,
      mockUsername
    );

    expect(result.pullRequests.opened).toBe(2);
    expect(result.pullRequests.merged).toBe(1);
    expect(result.pullRequests.closed).toBe(2);
    expect(result.pullRequests.mergeRate).toBe('50%');
  });

  test('External repositories, external PRs, and external issues are distinguished from own repos', () => {
    const rawEvents = [
      // Own repo PR
      {
        type: 'PullRequestEvent',
        payload: { action: 'opened' },
        repo: { name: 'octocat/Hello-World' },
        created_at: '2026-08-01T10:00:00Z',
      },
      // External repo PR 1
      {
        type: 'PullRequestEvent',
        payload: { action: 'opened' },
        repo: { name: 'facebook/react' },
        created_at: '2026-08-02T10:00:00Z',
      },
      // External repo PR 2
      {
        type: 'PullRequestEvent',
        payload: { action: 'opened' },
        repo: { name: 'vercel/next.js' },
        created_at: '2026-08-03T10:00:00Z',
      },
      // External repo Issue
      {
        type: 'IssuesEvent',
        payload: { action: 'opened' },
        repo: { name: 'facebook/react' },
        created_at: '2026-08-04T10:00:00Z',
      },
      // Own repo Issue (should not increment externalIssues)
      {
        type: 'IssuesEvent',
        payload: { action: 'opened' },
        repo: { name: 'octocat/Hello-World' },
        created_at: '2026-08-05T10:00:00Z',
      },
    ];

    const result = normalizeGitHubIntelligence(
      mockProfile,
      mockRepos,
      rawEvents,
      mockUsername
    );

    expect(result.pullRequests.opened).toBe(3);
    expect(result.openSource.externalPRs).toBe(2);
    expect(result.openSource.externalIssues).toBe(1);
    expect(result.openSource.externalReposContributed).toBe(2); // 'facebook/react' and 'vercel/next.js'
    expect(result.openSource.externalReposList).toContain('facebook/react');
    expect(result.openSource.externalReposList).toContain('vercel/next.js');
    expect(result.openSource.externalReposList).not.toContain('octocat/Hello-World');
  });

  test('Published releases only count ReleaseEvent and published releases', () => {
    const rawEvents = [
      {
        type: 'ReleaseEvent',
        payload: {
          release: {
            name: 'v1.0.0',
            tag_name: 'v1.0.0',
            published_at: '2026-08-01T12:00:00Z',
          },
        },
        repo: { name: 'octocat/Hello-World' },
        created_at: '2026-08-01T12:00:00Z',
      },
      {
        type: 'CreateEvent',
        payload: { ref_type: 'tag', ref: 'v1.0.1' }, // Tag creation should NOT count as release
        repo: { name: 'octocat/Hello-World' },
        created_at: '2026-08-02T12:00:00Z',
      },
      {
        type: 'PushEvent',
        payload: { commits: [{ message: 'Release v1.0.2' }] }, // Commit message should NOT count as release
        repo: { name: 'octocat/Hello-World' },
        created_at: '2026-08-03T12:00:00Z',
      },
    ];

    const result = normalizeGitHubIntelligence(
      mockProfile,
      mockRepos,
      rawEvents,
      mockUsername
    );

    expect(result.releases.count).toBe(1);
    expect(result.releases.published).toBe(1);
    expect(result.releases.latestRelease?.tagName).toBe('v1.0.0');
  });

  test('Code review counting does not fabricate data', () => {
    const rawEvents = [
      {
        type: 'PullRequestReviewEvent',
        payload: { action: 'submitted' },
        repo: { name: 'facebook/react' },
        created_at: '2026-08-01T10:00:00Z',
      },
      {
        type: 'PullRequestReviewCommentEvent',
        payload: { action: 'created' },
        repo: { name: 'facebook/react' },
        created_at: '2026-08-02T10:00:00Z',
      },
    ];

    const result = normalizeGitHubIntelligence(
      mockProfile,
      mockRepos,
      rawEvents,
      mockUsername
    );

    expect(result.reviews.submitted).toBe(2);
    expect(result.reviews.total).toBe(2);
    expect(result.reviews.status).toBe('active');
  });
});
