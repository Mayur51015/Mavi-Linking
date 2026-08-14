const mongoose = require('mongoose');

/**
 * Query parsing and aggregation shapes for the message endpoints.
 *
 * Split out from the controller so the pipeline and the clamping rules can be
 * asserted directly — the controller itself needs a live database to say
 * anything, which is why none of this was covered before.
 */

const CONVERSATIONS_DEFAULT_LIMIT = 20;
const CONVERSATIONS_MAX_LIMIT = 50;

const HISTORY_DEFAULT_LIMIT = 50;
const HISTORY_MAX_LIMIT = 100;

// Fields the conversation list needs about the other participant. Matches what
// the previous `User.find().select(...)` asked for.
const PARTICIPANT_FIELDS = {
  name: 1,
  username: 1,
  avatar: 1,
  role: 1,
  companyName: 1,
};

/**
 * Clamp a page/limit pair from the query string.
 *
 * Everything here is a string off the wire, so each value is parsed, checked
 * for NaN, floored at 1 and capped — an unvalidated `limit` is how a single
 * request turns into a full-collection read.
 */
const parsePagination = (query = {}, { defaultLimit, maxLimit }) => {
  const rawPage = Number.parseInt(query.page, 10);
  const rawLimit = Number.parseInt(query.limit, 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, maxLimit)
    : defaultLimit;

  return { page, limit, skip: (page - 1) * limit };
};

/**
 * Parse the chat-history window: how many messages, and the cursor to page
 * backwards from.
 *
 * A `createdAt` cursor rather than a skip offset, because messages arrive while
 * someone is scrolling and an offset would silently repeat or drop one.
 */
const parseHistoryQuery = (query = {}) => {
  const rawLimit = Number.parseInt(query.limit, 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, HISTORY_MAX_LIMIT)
    : HISTORY_DEFAULT_LIMIT;

  let before = null;
  if (query.before) {
    const parsed = new Date(query.before);
    if (!Number.isNaN(parsed.getTime())) {
      before = parsed;
    }
  }

  return { limit, before };
};

const isValidObjectId = (value) =>
  typeof value === 'string' && mongoose.Types.ObjectId.isValid(value) && /^[a-f0-9]{24}$/iu.test(value);

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

/**
 * One row per conversation, newest first, computed in the database.
 *
 * The controller used to load every message the user had ever sent or received
 * — unbounded, un-`lean()`, hydrated into Mongoose documents — and fold it down
 * to one row per partner in a JavaScript loop, discarding almost all of it. For
 * a recruiter with 20 threads of 200 messages that materialised 4,000 documents
 * to produce 20 rows, on every load of the inbox.
 *
 * `$group` after `$sort` keeps the first document per partner, which is the
 * latest; the unread count comes out of the same pass instead of needing a
 * second query per conversation.
 */
const buildConversationsPipeline = (userId, { skip, limit }) => {
  const id = toObjectId(userId);

  return [
    { $match: { $or: [{ senderId: id }, { recipientId: id }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [{ $eq: ['$senderId', id] }, '$recipientId', '$senderId'],
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$recipientId', id] },
                  { $ne: ['$status', 'read'] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    // Re-sort after grouping: $group makes no ordering promise.
    { $sort: { 'lastMessage.createdAt': -1 } },
    { $skip: skip },
    // Fetch one extra to answer "is there another page" without a count query.
    { $limit: limit + 1 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'participant',
      },
    },
    // Inner join: a conversation whose partner no longer exists is dropped,
    // which is what the old User.find()-and-map did too.
    { $unwind: '$participant' },
    {
      $project: {
        _id: 0,
        unreadCount: 1,
        lastMessage: 1,
        user: {
          _id: '$participant._id',
          ...Object.fromEntries(
            Object.keys(PARTICIPANT_FIELDS).map((field) => [field, `$participant.${field}`])
          ),
        },
      },
    },
  ];
};

/**
 * Filter for the messages exchanged between two users, optionally older than a
 * cursor.
 */
const buildHistoryFilter = (userId, otherUserId, before) => {
  const me = toObjectId(userId);
  const them = toObjectId(otherUserId);

  const filter = {
    $or: [
      { senderId: me, recipientId: them },
      { senderId: them, recipientId: me },
    ],
  };

  if (before) {
    filter.createdAt = { $lt: before };
  }

  return filter;
};

/**
 * Turn the newest-first page the query returns into what the client renders.
 *
 * The query has to sort descending to get the *latest* page, but the UI reads
 * oldest-first, so the page is reversed here. `limit + 1` rows were requested,
 * so an extra row means there is more history behind this one.
 */
const buildHistoryPage = (messages, limit) => {
  const hasMore = messages.length > limit;
  const page = hasMore ? messages.slice(0, limit) : messages;
  const ascending = [...page].reverse();

  return {
    messages: ascending,
    hasMore,
    // Cursor for the next (older) page: the oldest message on this one.
    nextBefore: hasMore && ascending.length > 0 ? ascending[0].createdAt : null,
  };
};

module.exports = {
  CONVERSATIONS_DEFAULT_LIMIT,
  CONVERSATIONS_MAX_LIMIT,
  HISTORY_DEFAULT_LIMIT,
  HISTORY_MAX_LIMIT,
  PARTICIPANT_FIELDS,
  parsePagination,
  parseHistoryQuery,
  isValidObjectId,
  buildConversationsPipeline,
  buildHistoryFilter,
  buildHistoryPage,
};
