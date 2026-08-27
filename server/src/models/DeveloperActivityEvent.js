const mongoose = require('mongoose');

const developerActivityEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['github', 'leetcode', 'codeforces', 'stackoverflow', 'system'],
      required: true,
    },
    eventType: {
      type: String,
      enum: [
        'REPOSITORY_CHANGE',
        'CONTRIBUTION_CHANGE',
        'RATING_CHANGE',
        'PROBLEM_SOLVING_CHANGE',
        'SKILL_CHANGE',
        'RANKING_CHANGE',
        'DNA_SCORE_CHANGE',
      ],
      required: true,
    },
    previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    // Identifier of the sync run that produced this event. Used together
    // with the other fields to detect repeated synchronization.
    syncVersion: { type: String, required: true },
    // When the change actually happened on the source platform. Historical
    // reconstruction always sorts on this field (not on insertion order),
    // so late-arriving / out-of-order platform updates still resolve to the
    // correct point-in-time state.
    occurredAt: { type: Date, default: Date.now, required: true },
    // sha256 of userId+platform+eventType+syncVersion+newValue. The unique
    // index below is what makes recordEvent() idempotent.
    dedupeKey: { type: String, required: true, unique: true },
  },
  { timestamps: { createdAt: 'recordedAt', updatedAt: false } }
);

developerActivityEventSchema.index({ userId: 1, occurredAt: -1 });
developerActivityEventSchema.index({ userId: 1, platform: 1, occurredAt: -1 });

// Events are immutable after creation — block every update path.
const blockMutation = function (next) {
  next(new Error('DeveloperActivityEvent records are immutable and cannot be updated.'));
};
developerActivityEventSchema.pre('findOneAndUpdate', blockMutation);
developerActivityEventSchema.pre('updateOne', blockMutation);
developerActivityEventSchema.pre('updateMany', blockMutation);

module.exports = mongoose.model('DeveloperActivityEvent', developerActivityEventSchema);