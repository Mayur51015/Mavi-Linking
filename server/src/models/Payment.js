const mongoose = require('mongoose');

/**
 * Payment Schema — Transaction ledger for B2B institutional subscription payments.
 * NEVER stores credit card numbers, CVVs, UPI PINs, bank passwords, or Razorpay secrets.
 */
const paymentSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'Institution ID is required'],
      index: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
      index: true,
    },
    planCode: {
      type: String,
      enum: ['BASIC', 'PRO', 'ENTERPRISE', 'CUSTOM'],
      default: 'PRO',
    },
    planVersion: {
      type: Number,
      default: 1,
    },
    provider: {
      type: String,
      enum: ['razorpay', 'stripe', 'manual'],
      default: 'razorpay',
    },
    providerPaymentId: {
      type: String,
      default: '',
      index: true,
    },
    providerOrderId: {
      type: String,
      default: '',
      index: true,
    },
    providerSignature: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['INITIATED', 'AUTHORIZED', 'CAPTURED', 'SUCCESS', 'FAILED', 'REFUNDED'],
      default: 'INITIATED',
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

paymentSchema.index({ institutionId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
