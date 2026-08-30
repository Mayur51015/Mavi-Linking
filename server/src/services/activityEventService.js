const crypto = require('crypto');
const DeveloperActivityEvent = require('../models/DeveloperActivityEvent');

const EVENT_TYPES = [
  'REPOSITORY_CHANGE',
  'CONTRIBUTION_CHANGE',
  'RATING_CHANGE',
  'PROBLEM_SOLVING_CHANGE',
  'SKILL_CHANGE',
  'RANKING_CHANGE',
  'DNA_SCORE_CHANGE',
];

const buildDedupeKey = ({ userId, platform, eventType, syncVersion, newValue }) => {
  const hash = crypto.createHash('sha256');
  hash.update(String(userId));
  hash.update(String(platform));
  hash.update(String(eventType));
  hash.update(String(syncVersion));
  hash.update(JSON.stringify(newValue ?? null));
  return hash.digest('hex');
};

/**
 * Record a normalized, immutable activity event.
 * Safe to call repeatedly with the same inputs — repeated synchronization
 * (same userId/platform/eventType/syncVersion/newValue) is a no-op.
 */
const recordEvent = async ({
  userId,
  platform,
  eventType,
  previousValue = null,
  newValue = null,
  syncVersion,
  occurredAt = new Date(),
}) => {
  if (!userId || !platform || !eventType || !syncVersion) {
    throw new Error('recordEvent requires userId, platform, eventType and syncVersion');
  }

  const dedupeKey = buildDedupeKey({ userId, platform, eventType, syncVersion, newValue });

  try {
    const event = await DeveloperActivityEvent.create({
      userId,
      platform,
      eventType,
      previousValue,
      newValue,
      syncVersion,
      occurredAt,
      dedupeKey,
    });
    return { created: true, event };
  } catch (err) {
    // Duplicate key => this exact change was already recorded (duplicate sync).
    if (err.code === 11000) {
      const existing = await DeveloperActivityEvent.findOne({ dedupeKey });
      return { created: false, event: existing };
    }
    throw err;
  }
};

/** Unified, cross-platform timeline for a user. */
const getUnifiedTimeline = async (userId, { platform, eventType, from, to, limit = 100 } = {}) => {
  const query = { userId };
  if (platform) query.platform = platform;
  if (eventType) query.eventType = eventType;
  if (from || to) {
    query.occurredAt = {};
    if (from) query.occurredAt.$gte = new Date(from);
    if (to) query.occurredAt.$lte = new Date(to);
  }

  return DeveloperActivityEvent.find(query)
    .sort({ occurredAt: -1 })
    .limit(Math.min(limit, 500))
    .lean();
};

/**
 * Reconstruct the latest known value of every (platform, eventType) pair as
 * of a given date, purely from the event log. Events are sorted ascending
 * by occurredAt (not by insertion order), so out-of-order platform updates
 * still resolve to the correct historical state.
 */
const reconstructStateAsOf = async (userId, targetDate) => {
  const asOf = targetDate ? new Date(targetDate) : new Date();

  const events = await DeveloperActivityEvent.find({
    userId,
    occurredAt: { $lte: asOf },
  })
    .sort({ occurredAt: 1 })
    .lean();

  const state = {};
  for (const event of events) {
    const key = `${event.platform}:${event.eventType}`;
    state[key] = {
      value: event.newValue,
      occurredAt: event.occurredAt,
      syncVersion: event.syncVersion,
    };
  }

  return { asOf, state };
};

module.exports = {
  EVENT_TYPES,
  buildDedupeKey,
  recordEvent,
  getUnifiedTimeline,
  reconstructStateAsOf,
};