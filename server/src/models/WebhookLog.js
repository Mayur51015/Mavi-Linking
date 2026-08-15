const mongoose = require('mongoose');

/**
 * WebhookLog Schema — Stores processed Razorpay Webhook Event IDs for strict Idempotency.
 * Prevents duplicate payment creation, double subscription activation, or duplicate invoice generation.
 */
const webhookLogSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      default: 'razorpay',
    },
    eventType: {
      type: String,
      required: true,
    },
    processed: {
      type: Boolean,
      default: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WebhookLog', webhookLogSchema);
