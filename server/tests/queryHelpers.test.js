const {
  escapeRegex,
  buildSearchFilter,
  buildExactRegex,
  parsePagination,
  totalPages,
  MAX_LIMIT,
} = require('../src/utils/queryHelpers');

describe('escapeRegex', () => {
  it('escapes every regex metacharacter', () => {
    expect(escapeRegex('.*+?^${}()|[]\\')).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
  });

  it('leaves ordinary text untouched', () => {
    expect(escapeRegex('data structures 101')).toBe('data structures 101');
  });

  it('handles null and undefined without throwing', () => {
    expect(escapeRegex(null)).toBe('');
    expect(escapeRegex(undefined)).toBe('');
  });

  it('produces a pattern that matches the input literally', () => {
    const term = 'C++ (advanced)';
    expect(new RegExp(escapeRegex(term)).test(term)).toBe(true);
    expect(new RegExp(escapeRegex(term)).test('C advanced')).toBe(false);
  });

  it('produces a valid pattern from input that would otherwise throw', () => {
    // `new RegExp('[')` throws — after escaping it must not.
    expect(() => new RegExp(escapeRegex('['))).not.toThrow();
  });
});

describe('buildSearchFilter', () => {
  it('builds an $or clause across the requested fields', () => {
    const filter = buildSearchFilter('notes', ['title', 'description']);
    expect(filter).toEqual({
      $or: [
        { title: { $regex: 'notes', $options: 'i' } },
        { description: { $regex: 'notes', $options: 'i' } },
      ],
    });
  });

  it('returns null when there is no usable search term', () => {
    expect(buildSearchFilter('', ['title'])).toBeNull();
    expect(buildSearchFilter('   ', ['title'])).toBeNull();
    expect(buildSearchFilter(undefined, ['title'])).toBeNull();
    expect(buildSearchFilter(null, ['title'])).toBeNull();
  });

  it('returns null when no fields are given', () => {
    expect(buildSearchFilter('notes', [])).toBeNull();
    expect(buildSearchFilter('notes', undefined)).toBeNull();
  });

  it('rejects a non-string search value, so ?search[$ne]= cannot inject an object', () => {
    expect(buildSearchFilter({ $ne: null }, ['title'])).toBeNull();
    expect(buildSearchFilter(['a', 'b'], ['title'])).toBeNull();
  });

  it('neutralises a match-everything pattern', () => {
    const filter = buildSearchFilter('.*', ['title']);
    expect(filter.$or[0].title.$regex).toBe('\\.\\*');
    // The escaped pattern matches the literal string ".*", not everything.
    expect(new RegExp(filter.$or[0].title.$regex).test('unrelated title')).toBe(false);
    expect(new RegExp(filter.$or[0].title.$regex).test('a .* b')).toBe(true);
  });

  it('neutralises a catastrophic-backtracking pattern', () => {
    const filter = buildSearchFilter('(a+)+$', ['title']);
    const pattern = new RegExp(filter.$or[0].title.$regex);
    const hostile = 'a'.repeat(40) + 'b';

    const start = Date.now();
    pattern.test(hostile);
    // The escaped pattern is a literal, so this is effectively instant.
    expect(Date.now() - start).toBeLessThan(100);
  });

  it('trims the search term', () => {
    const filter = buildSearchFilter('  spaced  ', ['title']);
    expect(filter.$or[0].title.$regex).toBe('spaced');
  });

  it('truncates an over-long search term', () => {
    const filter = buildSearchFilter('x'.repeat(500), ['title']);
    expect(filter.$or[0].title.$regex).toHaveLength(100);
  });

  it('honours a custom maxLength', () => {
    const filter = buildSearchFilter('x'.repeat(50), ['title'], { maxLength: 10 });
    expect(filter.$or[0].title.$regex).toHaveLength(10);
  });
});

describe('buildExactRegex', () => {
  it('anchors the pattern at both ends', () => {
    const re = buildExactRegex('ada');
    expect(re.test('ada')).toBe(true);
    expect(re.test('adalovelace')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(buildExactRegex('ada').test('ADA')).toBe(true);
  });

  it('escapes metacharacters in the value', () => {
    expect(buildExactRegex('a.c').test('abc')).toBe(false);
    expect(buildExactRegex('a.c').test('a.c')).toBe(true);
  });
});

describe('parsePagination', () => {
  it('applies defaults for an empty query', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it('parses valid values', () => {
    expect(parsePagination({ page: '3', limit: '25' })).toEqual({ page: 3, limit: 25, skip: 50 });
  });

  it('never returns a negative skip for page=0', () => {
    const { page, skip } = parsePagination({ page: '0' });
    expect(page).toBe(1);
    expect(skip).toBe(0);
  });

  it('never returns a negative skip for a negative page', () => {
    expect(parsePagination({ page: '-5' }).skip).toBe(0);
  });

  it('falls back to defaults for non-numeric input rather than producing NaN', () => {
    const result = parsePagination({ page: 'abc', limit: 'xyz' });
    expect(result).toEqual({ page: 1, limit: 10, skip: 0 });
    expect(Number.isNaN(result.skip)).toBe(false);
  });

  it('clamps an oversized limit', () => {
    expect(parsePagination({ limit: '999999' }).limit).toBe(MAX_LIMIT);
  });

  it('replaces limit=0 with the default rather than dividing by zero later', () => {
    expect(parsePagination({ limit: '0' }).limit).toBe(10);
  });

  it('honours a custom default and maximum', () => {
    expect(parsePagination({}, { defaultLimit: 50 }).limit).toBe(50);
    expect(parsePagination({ limit: '80' }, { maxLimit: 20 }).limit).toBe(20);
  });

  it('ignores array-valued params, as produced by ?page=1&page=2', () => {
    const result = parsePagination({ page: ['1', '2'] });
    expect(Number.isInteger(result.page)).toBe(true);
    expect(result.page).toBeGreaterThanOrEqual(1);
  });

  it('always returns integers', () => {
    const { page, limit, skip } = parsePagination({ page: '2.7', limit: '5.9' });
    expect(Number.isInteger(page)).toBe(true);
    expect(Number.isInteger(limit)).toBe(true);
    expect(Number.isInteger(skip)).toBe(true);
  });
});

describe('totalPages', () => {
  it('rounds up partial pages', () => {
    expect(totalPages(25, 10)).toBe(3);
    expect(totalPages(30, 10)).toBe(3);
  });

  it('returns 0 for an empty result set', () => {
    expect(totalPages(0, 10)).toBe(0);
  });

  it('returns 0 rather than Infinity when limit is 0', () => {
    expect(totalPages(10, 0)).toBe(0);
    expect(Number.isFinite(totalPages(10, 0))).toBe(true);
  });
});
