const mongoose = require('mongoose');

const {
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
} = require('../src/controllers/messagePagination');

const Message = require('../src/models/Message');

const ME = '507f1f77bcf86cd799439011';
const THEM = '507f191e810c19729de860ea';

const conversationOpts = {
  defaultLimit: CONVERSATIONS_DEFAULT_LIMIT,
  maxLimit: CONVERSATIONS_MAX_LIMIT,
};

const stageNamed = (pipeline, name) => pipeline.find((stage) => name in stage);

describe('parsePagination', () => {
  it('defaults to the first page at the default limit', () => {
    expect(parsePagination({}, conversationOpts)).toEqual({
      page: 1,
      limit: CONVERSATIONS_DEFAULT_LIMIT,
      skip: 0,
    });
  });

  it('computes skip from page and limit', () => {
    expect(parsePagination({ page: '3', limit: '10' }, conversationOpts)).toEqual({
      page: 3,
      limit: 10,
      skip: 20,
    });
  });

  it('caps the limit', () => {
    // Unvalidated, `limit` is how one request becomes a full-collection read.
    expect(parsePagination({ limit: '100000' }, conversationOpts).limit).toBe(
      CONVERSATIONS_MAX_LIMIT
    );
  });

  it('falls back to defaults for junk, negatives and zero', () => {
    for (const query of [
      { page: 'abc', limit: 'xyz' },
      { page: '-5', limit: '-10' },
      { page: '0', limit: '0' },
      { page: {}, limit: [] },
      { page: null, limit: undefined },
    ]) {
      expect(parsePagination(query, conversationOpts)).toEqual({
        page: 1,
        limit: CONVERSATIONS_DEFAULT_LIMIT,
        skip: 0,
      });
    }
  });

  it('truncates a fractional page rather than producing a fractional skip', () => {
    const { page, skip } = parsePagination({ page: '2.9', limit: '10' }, conversationOpts);

    expect(page).toBe(2);
    expect(Number.isInteger(skip)).toBe(true);
  });
});

describe('parseHistoryQuery', () => {
  it('defaults to the most recent page with no cursor', () => {
    expect(parseHistoryQuery({})).toEqual({ limit: HISTORY_DEFAULT_LIMIT, before: null });
  });

  it('caps the limit', () => {
    expect(parseHistoryQuery({ limit: '5000' }).limit).toBe(HISTORY_MAX_LIMIT);
  });

  it('parses an ISO cursor', () => {
    const iso = '2026-08-14T10:30:00.000Z';

    expect(parseHistoryQuery({ before: iso }).before).toEqual(new Date(iso));
  });

  it('ignores a cursor it cannot parse rather than sending Invalid Date to Mongo', () => {
    for (const before of ['not-a-date', '', 'null', '2026-13-45']) {
      expect(parseHistoryQuery({ before }).before).toBeNull();
    }
  });
});

describe('isValidObjectId', () => {
  it('accepts a 24-character hex id', () => {
    expect(isValidObjectId(ME)).toBe(true);
  });

  it('rejects values Mongoose would otherwise coerce', () => {
    // mongoose.isValid() accepts any 12-character string and any 12-byte
    // buffer, so a plain name like 'abcdefghijkl' would sail through and match
    // some unrelated document. The hex check is what stops that.
    for (const value of ['abcdefghijkl', 'not-an-id', '', null, undefined, 12, {}]) {
      expect(isValidObjectId(value)).toBe(false);
    }
  });
});

describe('buildConversationsPipeline', () => {
  const pipeline = buildConversationsPipeline(ME, { skip: 0, limit: 20 });

  it('matches only the caller\'s own messages', () => {
    const { $match } = stageNamed(pipeline, '$match');

    expect($match.$or).toHaveLength(2);
    expect($match.$or[0].senderId.toString()).toBe(ME);
    expect($match.$or[1].recipientId.toString()).toBe(ME);
  });

  it('sorts before grouping so $first is the latest message', () => {
    const sortIndex = pipeline.findIndex((stage) => '$sort' in stage);
    const groupIndex = pipeline.findIndex((stage) => '$group' in stage);

    expect(sortIndex).toBeLessThan(groupIndex);
    expect(pipeline[sortIndex].$sort).toEqual({ createdAt: -1 });
    expect(pipeline[groupIndex].$group.lastMessage).toEqual({ $first: '$$ROOT' });
  });

  it('groups by the other participant, whichever side of the message they are on', () => {
    const { $group } = stageNamed(pipeline, '$group');

    expect($group._id.$cond[1]).toBe('$recipientId');
    expect($group._id.$cond[2]).toBe('$senderId');
  });

  it('counts only inbound messages that are not yet read', () => {
    const { $group } = stageNamed(pipeline, '$group');
    const [condition] = $group.unreadCount.$sum.$cond;

    expect(condition.$and[0].$eq[0]).toBe('$recipientId');
    expect(condition.$and[1]).toEqual({ $ne: ['$status', 'read'] });
  });

  it('re-sorts after grouping, which makes no ordering promise', () => {
    const sorts = pipeline.filter((stage) => '$sort' in stage);

    expect(sorts).toHaveLength(2);
    expect(sorts[1].$sort).toEqual({ 'lastMessage.createdAt': -1 });
  });

  it('applies skip and limit in the database, not in JavaScript', () => {
    const paged = buildConversationsPipeline(ME, { skip: 40, limit: 20 });

    expect(stageNamed(paged, '$skip').$skip).toBe(40);
    // One extra row, so "is there another page" needs no count query.
    expect(stageNamed(paged, '$limit').$limit).toBe(21);
  });

  it('limits before the lookup, so only the returned page is joined', () => {
    const limitIndex = pipeline.findIndex((stage) => '$limit' in stage);
    const lookupIndex = pipeline.findIndex((stage) => '$lookup' in stage);

    expect(limitIndex).toBeLessThan(lookupIndex);
  });

  it('projects the same participant fields the old select asked for', () => {
    const { $project } = stageNamed(pipeline, '$project');

    for (const field of Object.keys(PARTICIPANT_FIELDS)) {
      expect($project.user[field]).toBe(`$participant.${field}`);
    }
    expect($project.user._id).toBe('$participant._id');
  });

  it('returns the shape the client already reads', () => {
    const { $project } = stageNamed(pipeline, '$project');

    expect($project.lastMessage).toBe(1);
    expect($project.unreadCount).toBe(1);
    expect($project.user).toBeDefined();
  });

  it('drops conversations whose partner no longer exists, as before', () => {
    const { $unwind } = stageNamed(pipeline, '$unwind');

    // A plain string $unwind is an inner join — matching the old behaviour,
    // where User.find() simply didn't return a deleted account.
    expect($unwind).toBe('$participant');
  });
});

describe('buildHistoryFilter', () => {
  it('matches messages in both directions between the two users', () => {
    const filter = buildHistoryFilter(ME, THEM, null);

    expect(filter.$or[0].senderId.toString()).toBe(ME);
    expect(filter.$or[0].recipientId.toString()).toBe(THEM);
    expect(filter.$or[1].senderId.toString()).toBe(THEM);
    expect(filter.$or[1].recipientId.toString()).toBe(ME);
  });

  it('uses ObjectIds, not the raw strings from the request', () => {
    const filter = buildHistoryFilter(ME, THEM, null);

    expect(filter.$or[0].senderId).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(filter.$or[0].recipientId).toBeInstanceOf(mongoose.Types.ObjectId);
  });

  it('adds no cursor clause when paging the most recent page', () => {
    expect(buildHistoryFilter(ME, THEM, null).createdAt).toBeUndefined();
  });

  it('pages strictly backwards from the cursor', () => {
    const before = new Date('2026-08-14T10:30:00.000Z');

    // $lt, not $lte — otherwise the boundary message repeats on every page.
    expect(buildHistoryFilter(ME, THEM, before).createdAt).toEqual({ $lt: before });
  });
});

describe('buildHistoryPage', () => {
  const rowsNewestFirst = (count) =>
    Array.from({ length: count }, (_, i) => ({
      _id: `m${i}`,
      createdAt: new Date(2026, 0, 1, 0, 0, count - i),
    }));

  it('flips the newest-first query result into render order', () => {
    const { messages } = buildHistoryPage(rowsNewestFirst(3), 10);

    expect(messages.map((m) => m._id)).toEqual(['m2', 'm1', 'm0']);
    expect(messages[0].createdAt.getTime()).toBeLessThan(messages[2].createdAt.getTime());
  });

  it('reports no more history when the page is not full', () => {
    expect(buildHistoryPage(rowsNewestFirst(3), 10)).toMatchObject({
      hasMore: false,
      nextBefore: null,
    });
  });

  it('drops the extra row and reports more when the page is full', () => {
    const { messages, hasMore } = buildHistoryPage(rowsNewestFirst(11), 10);

    expect(messages).toHaveLength(10);
    expect(hasMore).toBe(true);
  });

  it('hands back the oldest message on the page as the next cursor', () => {
    const { messages, nextBefore } = buildHistoryPage(rowsNewestFirst(11), 10);

    expect(nextBefore).toEqual(messages[0].createdAt);
  });

  it('handles an empty thread', () => {
    expect(buildHistoryPage([], 10)).toEqual({ messages: [], hasMore: false, nextBefore: null });
  });

  it('does not mutate the rows it was given', () => {
    const rows = rowsNewestFirst(3);
    const before = rows.map((r) => r._id);

    buildHistoryPage(rows, 10);

    expect(rows.map((r) => r._id)).toEqual(before);
  });
});

describe('Message schema', () => {
  const indexKeys = () => Message.schema.indexes().map(([key]) => key);

  it('indexes recipientId as a prefix so the $or does not scan the collection', () => {
    // The conversation list matches {$or: [{senderId: me}, {recipientId: me}]}.
    // The pre-existing {senderId, recipientId, createdAt} index covers the
    // senderId branch, but nothing led with recipientId.
    expect(indexKeys()).toContainEqual({ recipientId: 1, createdAt: -1 });
  });

  it('indexes recipientId with status for the unread count and read-marking', () => {
    expect(indexKeys()).toContainEqual({ recipientId: 1, status: 1 });
  });

  it('keeps the existing thread index', () => {
    expect(indexKeys()).toContainEqual({ senderId: 1, recipientId: 1, createdAt: -1 });
  });

  it('bounds the message body', () => {
    expect(Message.MESSAGE_MAX_LENGTH).toBeGreaterThan(0);
    expect(Message.schema.path('content').options.maxlength[0]).toBe(Message.MESSAGE_MAX_LENGTH);
  });

  it('rejects a message longer than the limit', () => {
    const message = new Message({
      senderId: new mongoose.Types.ObjectId(),
      recipientId: new mongoose.Types.ObjectId(),
      content: 'x'.repeat(Message.MESSAGE_MAX_LENGTH + 1),
    });

    expect(message.validateSync().errors.content).toBeDefined();
  });

  it('accepts a message at the limit', () => {
    const message = new Message({
      senderId: new mongoose.Types.ObjectId(),
      recipientId: new mongoose.Types.ObjectId(),
      content: 'x'.repeat(Message.MESSAGE_MAX_LENGTH),
    });

    expect(message.validateSync()).toBeUndefined();
  });
});
