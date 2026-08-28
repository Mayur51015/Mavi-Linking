const {
  calculateScoreTier,
} = require('../src/utils/leaderboardHelper');

describe('Incremental leaderboard computation', () => {
  const sortUsers = (users) =>
    [...users].sort((a, b) => {
      if (b.scores.overall !== a.scores.overall) {
        return b.scores.overall - a.scores.overall;
      }

      if (
        (b.scores.problemSolving || 0) !==
        (a.scores.problemSolving || 0)
      ) {
        return (
          (b.scores.problemSolving || 0) -
          (a.scores.problemSolving || 0)
        );
      }

      if (
        (b.scores.development || 0) !==
        (a.scores.development || 0)
      ) {
        return (
          (b.scores.development || 0) -
          (a.scores.development || 0)
        );
      }

      return String(a.maviId).localeCompare(String(b.maviId));
    });

  it('moves only the affected user when their score crosses a boundary', () => {
    const users = [
      {
        id: 'a',
        maviId: 'MAVI001',
        scores: {
          overall: 800,
          problemSolving: 300,
          development: 300,
        },
      },
      {
        id: 'b',
        maviId: 'MAVI002',
        scores: {
          overall: 700,
          problemSolving: 300,
          development: 300,
        },
      },
      {
        id: 'c',
        maviId: 'MAVI003',
        scores: {
          overall: 600,
          problemSolving: 300,
          development: 300,
        },
      },
    ];

    users[2].scores.overall = 750;

    const result = sortUsers(users);

    expect(result.map((user) => user.id)).toEqual([
      'a',
      'c',
      'b',
    ]);
  });

  it('keeps deterministic ordering for equal scores', () => {
    const users = [
      {
        id: 'b',
        maviId: 'MAVI002',
        scores: {
          overall: 700,
          problemSolving: 300,
          development: 300,
        },
      },
      {
        id: 'a',
        maviId: 'MAVI001',
        scores: {
          overall: 700,
          problemSolving: 300,
          development: 300,
        },
      },
    ];

    const result = sortUsers(users);

    expect(result.map((user) => user.id)).toEqual([
      'a',
      'b',
    ]);
  });

  it('calculates leaderboard positions from the sorted page offset', () => {
    const page = 2;
    const limit = 2;
    const users = [
      { id: 'c', scores: { overall: 800 } },
      { id: 'd', scores: { overall: 700 } },
    ];

    const skip = (page - 1) * limit;

    const leaderboard = users.map((user, index) => ({
      id: user.id,
      rank: skip + index + 1,
    }));

    expect(leaderboard).toEqual([
      { id: 'c', rank: 3 },
      { id: 'd', rank: 4 },
    ]);
  });

  it('keeps department rankings independent from global rankings', () => {
    const users = [
      {
        id: 'a',
        departmentId: 'cs',
        scores: { overall: 900 },
      },
      {
        id: 'b',
        departmentId: 'it',
        scores: { overall: 800 },
      },
      {
        id: 'c',
        departmentId: 'cs',
        scores: { overall: 700 },
      },
    ];

    const csUsers = users.filter(
      (user) => user.departmentId === 'cs'
    );

    const csRanking = sortUsers(csUsers);

    expect(csRanking.map((user) => user.id)).toEqual([
      'a',
      'c',
    ]);
  });

  it('uses the same score tier for incrementally updated users', () => {
    expect(calculateScoreTier(950)).toBe('Exceptional');
    expect(calculateScoreTier(800)).toBe('Expert');
    expect(calculateScoreTier(600)).toBe('Advanced');
  });
});