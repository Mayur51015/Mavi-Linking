/**
 * Helpers for turning untrusted `req.query` values into safe Mongo queries.
 *
 * Two problems these exist to solve:
 *
 * 1. Search terms were being interpolated straight into `$regex`, so the
 *    caller controlled the pattern. `.*` matches everything (bypassing
 *    department scoping), `(a+)+$` backtracks catastrophically and stalls the
 *    event loop for every other request, and `[` throws inside the driver.
 *
 * 2. `page`/`limit` were passed through `parseInt` with no bounds, so `page=0`
 *    produced a negative `skip` (which Mongo rejects), `page=abc` produced
 *    `NaN`, and `limit=999999` would happily try to serialize the collection.
 */

// Defaults chosen to match what the controllers were already using.
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Escape every regular-expression metacharacter in a string so it matches
 * literally.
 *
 * @param {string} input
 * @returns {string}
 */
const escapeRegex = (input) => String(input ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Build a case-insensitive "contains" filter across several fields.
 *
 * @param {string} search raw user input
 * @param {string[]} fields field names to search
 * @param {{ maxLength?: number }} [options] cap on the search term; longer
 *   input is truncated rather than rejected, since a very long pattern is
 *   itself a cheap way to make matching expensive
 * @returns {{ $or: object[] } | null} null when there is nothing to search for,
 *   so callers can skip merging it into the query
 */
const buildSearchFilter = (search, fields, options = {}) => {
  const { maxLength = 100 } = options;

  if (typeof search !== 'string') return null;

  const term = search.trim().slice(0, maxLength);
  if (!term || !Array.isArray(fields) || fields.length === 0) return null;

  const safe = escapeRegex(term);

  return {
    $or: fields.map((field) => ({ [field]: { $regex: safe, $options: 'i' } })),
  };
};

/**
 * Build a case-insensitive anchored regex that matches the input literally.
 * Used for handle lookups, where "contains" would be wrong.
 *
 * @param {string} value
 * @returns {RegExp}
 */
const buildExactRegex = (value) => new RegExp(`^${escapeRegex(value)}$`, 'i');

/**
 * Coerce `page`/`limit` query params into safe integers.
 *
 * @param {object} query typically `req.query`
 * @param {{ defaultLimit?: number, maxLimit?: number }} [options]
 * @returns {{ page: number, limit: number, skip: number }} always positive
 *   integers, so `skip` is never negative or NaN
 */
const parsePagination = (query = {}, options = {}) => {
  const { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = options;

  const page = toPositiveInt(query.page, DEFAULT_PAGE);
  const limit = Math.min(toPositiveInt(query.limit, defaultLimit), maxLimit);

  return { page, limit, skip: (page - 1) * limit };
};

/**
 * Parse a value into an integer of at least 1, falling back when the input is
 * missing, non-numeric, zero or negative.
 *
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

/**
 * Total page count that stays finite for an empty result set.
 *
 * @param {number} total
 * @param {number} limit
 * @returns {number}
 */
const totalPages = (total, limit) => {
  if (!limit || limit < 1) return 0;
  return Math.ceil(total / limit);
};

module.exports = {
  escapeRegex,
  buildSearchFilter,
  buildExactRegex,
  parsePagination,
  totalPages,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};
