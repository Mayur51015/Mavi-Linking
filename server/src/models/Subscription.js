const mongoose = require('mongoose');

/**
 * Subscription Schema — B2B Institutional SaaS Subscriptions.
 * Belongs strictly to institutionId (paying customer).
 * Retains immutable plan version and price snapshot.
 */
const subscriptionSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'Institution ID is required'],
      index: true,
    },
    planCode: {
      type: String,
      enum: ['BASIC', 'PRO', 'ENTERPRISE', 'CUSTOM'],
      default: 'ENTERPRISE',
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      default: null,
    },
    planVersion: {
      type: Number,
      default: 1,
    },
    priceSnapshot: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      interval: { type: String, default: 'annual' },
    },
    status: {
      type: String,
      enum: ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    provider: {
      type: String,
      enum: ['razorpay', 'stripe', 'manual'],
      default: 'razorpay',
    },
    providerCustomerId: {
      type: String,
      default: '',
    },
    providerSubscriptionId: {
      type: String,
      default: '',
    },
    providerOrderId: {
      type: String,
      default: '',
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year default
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    billingContact: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      gstin: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    paymentHistory: [
      {
        paymentId: { type: String, required: true },
        orderId: { type: String, default: '' },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
        planVersion: { type: Number, default: 1 },
        status: { type: String, enum: ['SUCCESS', 'FAILED', 'REFUNDED'], default: 'SUCCESS' },
        method: { type: String, default: 'card' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

subscriptionSchema.index({ institutionId: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
