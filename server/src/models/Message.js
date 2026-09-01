const mongoose = require('mongoose');

// Long enough for any real message, short enough that a single row can't be
// used to inflate the collection. express.json caps the request body at 10kb,
// but that is a transport limit and doesn't apply to anything writing through
// the model directly.
const MESSAGE_MAX_LENGTH = 5000;

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [
        MESSAGE_MAX_LENGTH,
        `Message content cannot exceed ${MESSAGE_MAX_LENGTH} characters`,
      ],
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
  },
  { timestamps: true }
);

// Serves the thread query, which pins both participants.
messageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });

// The conversation list matches `{$or: [{senderId: me}, {recipientId: me}]}`.
// The index above covers the senderId branch — it's the prefix — but nothing
// had recipientId as a prefix, so that half of every $or was a collection scan.
messageSchema.index({ recipientId: 1, createdAt: -1 });

// Unread counting, and the updateMany that marks a thread read.
messageSchema.index({ recipientId: 1, status: 1 });

// Exposed the way User.SENSITIVE_FIELDS is, so the controller validates
// against the schema's own limit rather than a second copy of the number.
messageSchema.statics.MESSAGE_MAX_LENGTH = MESSAGE_MAX_LENGTH;

module.exports = mongoose.model('Message', messageSchema);
