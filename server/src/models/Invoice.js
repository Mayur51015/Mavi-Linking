const mongoose = require('mongoose');

/**
 * Invoice Schema — Official B2B Institutional Invoices for Accounting & Compliance.
 */
const invoiceSchema = new mongoose.Schema(
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
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    planVersion: {
      type: Number,
      default: 1,
    },
    providerInvoiceId: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PAID', 'UNPAID', 'VOID', 'REFUNDED'],
      default: 'PAID',
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    billingDetails: {
      institutionName: { type: String, default: '' },
      tenantId: { type: String, default: '' },
      contactEmail: { type: String, default: '' },
      contactPhone: { type: String, default: '' },
      gstin: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    lineItems: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        periodStart: { type: Date },
        periodEnd: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

invoiceSchema.index({ institutionId: 1, createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
