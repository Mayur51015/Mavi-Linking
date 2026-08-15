const Institution = require('../models/Institution');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const WebhookLog = require('../models/WebhookLog');
const AuditLog = require('../models/AuditLog');
const { getPaymentProvider } = require('../services/paymentProvider');
const { getInstitutionEntitlements, checkPlanLimit } = require('../services/entitlementService');

/**
 * Seed Canonical Active Default SaaS Plans if Catalog is empty
 */
const seedDefaultPlansIfEmpty = async () => {
  await Plan.collection.dropIndex('code_1').catch(() => {});
  const count = await Plan.countDocuments();
  if (count === 0) {
    console.log('[SAAS CATALOG SEED] Seeding canonical SaaS plans (BASIC, PRO, ENTERPRISE)...');
    await Plan.create([
      {
        name: 'Basic Institutional Plan',
        code: 'BASIC',
        version: 1,
        description: 'For small institutes and colleges starting AI Developer analytics',
        price: { amount: 49999, currency: 'INR', interval: 'annual' },
        limits: { maxStudents: 500, maxTeachers: 50, maxRecruiters: 10, maxDepartments: 5, storageGb: 25, aiMonthlyLimit: 1000 },
        features: { developerDNA: true, recruiterAIReport: true, advancedAnalytics: false, aiCareerGuidance: true, placementEngine: false, customDomain: false, prioritySupport: false },
        status: 'ACTIVE',
      },
      {
        name: 'Professional Institutional Plan',
        code: 'PRO',
        version: 1,
        description: 'For mid-sized engineering colleges seeking full placement readiness analytics',
        price: { amount: 149999, currency: 'INR', interval: 'annual' },
        limits: { maxStudents: 2500, maxTeachers: 200, maxRecruiters: 50, maxDepartments: 15, storageGb: 100, aiMonthlyLimit: 5000 },
        features: { developerDNA: true, recruiterAIReport: true, advancedAnalytics: true, aiCareerGuidance: true, placementEngine: true, customDomain: false, prioritySupport: false },
        status: 'ACTIVE',
      },
      {
        name: 'Enterprise University Plan',
        code: 'ENTERPRISE',
        version: 1,
        description: 'For large autonomous universities needing priority SLA and custom branding',
        price: { amount: 299999, currency: 'INR', interval: 'annual' },
        limits: { maxStudents: 10000, maxTeachers: 500, maxRecruiters: 200, maxDepartments: 50, storageGb: 500, aiMonthlyLimit: 25000 },
        features: { developerDNA: true, recruiterAIReport: true, advancedAnalytics: true, aiCareerGuidance: true, placementEngine: true, customDomain: true, prioritySupport: true },
        status: 'ACTIVE',
      },
    ]);
  }
};

/**
 * @desc    Get all published ACTIVE SaaS plans (Public / Backend-driven catalog)
 * @route   GET /api/billing/plans
 * @access  Public / Protected
 */
const getPublishedPlans = async (req, res, next) => {
  try {
    await seedDefaultPlansIfEmpty();

    // Query active plans sorted by latest version
    const plans = await Plan.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $sort: { version: -1 } },
      {
        $group: {
          _id: '$code',
          latestPlan: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$latestPlan' } },
      { $sort: { 'price.amount': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get institution subscription, usage metrics, price snapshot, and payment history
 * @route   GET /api/billing/subscription
 * @access  Private (Institution Billing Admin)
 */
const getInstitutionBilling = async (req, res, next) => {
  try {
    await seedDefaultPlansIfEmpty();
    const institutionId = req.institutionScope?.institutionId || req.user.institutionId;

    if (!institutionId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Active institution context required to access billing.',
      });
    }

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution record not found.' });
    }

    let subscription = await Subscription.findOne({ institutionId }).sort({ createdAt: -1 });

    if (!subscription) {
      const activePlan = await Plan.findOne({ code: institution.plan || 'ENTERPRISE', status: 'ACTIVE' }).sort({ version: -1 });
      subscription = await Subscription.create({
        institutionId: institution._id,
        planCode: institution.plan || 'ENTERPRISE',
        planVersion: activePlan ? activePlan.version : 1,
        priceSnapshot: activePlan ? activePlan.price : { amount: 299999, currency: 'INR', interval: 'annual' },
        status: institution.subscriptionStatus || 'ACTIVE',
        billingContact: {
          name: institution.primaryContact?.name || institution.name,
          email: institution.primaryContact?.email || '',
          phone: institution.primaryContact?.phone || '',
          address: institution.address || '',
        },
      });

      institution.subscriptionId = subscription._id;
      await institution.save();
    }

    // Resource Usage Metrics against Plan Limits
    const [studentLimit, teacherLimit, recruiterLimit, deptLimit] = await Promise.all([
      checkPlanLimit(institution._id, 'student'),
      checkPlanLimit(institution._id, 'teacher'),
      checkPlanLimit(institution._id, 'recruiter'),
      checkPlanLimit(institution._id, 'department'),
    ]);

    const entitlements = await getInstitutionEntitlements(institution._id);

    // Fetch Published Catalog Plans from DB for dynamic frontend rendering
    const availablePlans = await Plan.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $sort: { version: -1 } },
      {
        $group: {
          _id: '$code',
          latestPlan: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$latestPlan' } },
      { $sort: { 'price.amount': 1 } },
    ]);

    // Fetch Payment Ledger History
    const payments = await Payment.find({ institutionId: institution._id }).sort({ createdAt: -1 }).limit(20);

    res.status(200).json({
      success: true,
      data: {
        institution: {
          id: institution._id,
          name: institution.name,
          code: institution.code,
          tenantId: institution.tenantId,
          plan: institution.plan || 'ENTERPRISE',
          subscriptionStatus: subscription.status,
          billingProfile: institution.billingProfile || {},
        },
        subscription: {
          id: subscription._id,
          planCode: subscription.planCode,
          planVersion: subscription.planVersion || 1,
          priceSnapshot: subscription.priceSnapshot || { amount: 149999, currency: 'INR', interval: 'annual' },
          status: subscription.status,
          provider: subscription.provider,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          billingContact: subscription.billingContact,
        },
        usage: {
          students: { current: studentLimit.currentCount, limit: studentLimit.limit },
          teachers: { current: teacherLimit.currentCount, limit: teacherLimit.limit },
          recruiters: { current: recruiterLimit.currentCount, limit: recruiterLimit.limit },
          departments: { current: deptLimit.currentCount, limit: deptLimit.limit },
        },
        availablePlans,
        entitlements,
        paymentHistory: payments.map((p) => ({
          paymentId: p.providerPaymentId || p._id.toString(),
          orderId: p.providerOrderId,
          amount: p.amount,
          currency: p.currency,
          planVersion: p.planVersion || 1,
          status: p.status,
          method: p.provider,
          createdAt: p.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Initiate checkout session for subscription purchase/upgrade
 * @route   POST /api/billing/checkout
 * @access  Private (Institution Billing Admin)
 */
const createCheckoutSession = async (req, res, next) => {
  try {
    const institutionId = req.institutionScope?.institutionId || req.user.institutionId;
    const { targetPlanCode = 'PRO', billingCycle = 'annual' } = req.body;

    if (!institutionId) {
      return res.status(403).json({ success: false, message: 'Forbidden. Institution scope required.' });
    }

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    // Determine plan price & version from DB (NEVER TRUST CLIENT-SUPPLIED PRICE)
    const plan = await Plan.findOne({ code: targetPlanCode, status: 'ACTIVE' }).sort({ version: -1 });
    const amount = plan && plan.price?.amount ? plan.price.amount : targetPlanCode === 'BASIC' ? 49999 : targetPlanCode === 'PRO' ? 149999 : 299999;
    const planVersion = plan ? plan.version : 1;

    const provider = getPaymentProvider('razorpay');

    const order = await provider.createOrder({
      amount,
      currency: 'INR',
      receipt: `rcpt_${institution.tenantId}_${Date.now()}`,
      notes: {
        institutionId: institution._id.toString(),
        tenantId: institution.tenantId,
        targetPlanCode,
        planVersion,
        billingCycle,
      },
    });

    // Create Payment Record in INITIATED Status
    const payment = await Payment.create({
      institutionId: institution._id,
      planCode: targetPlanCode,
      planVersion,
      provider: 'razorpay',
      providerOrderId: order.id,
      amount,
      currency: order.currency || 'INR',
      status: 'INITIATED',
      metadata: { billingCycle, targetPlanCode, planVersion },
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      institutionId: institution._id,
      tenantId: institution.tenantId,
      action: 'SUBSCRIPTION_CHECKOUT_INITIATED',
      details: { targetPlanCode, planVersion, amount, orderId: order.id, paymentRecordId: payment._id },
      result: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: 'Razorpay checkout order created successfully',
      data: {
        orderId: order.id,
        paymentRecordId: payment._id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID || provider.keyId || 'rzp_test_TQ0mLvJPyus2JW',
        targetPlanCode,
        planVersion,
        institutionName: institution.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Server-Side Payment Signature Verification Callback
 * @route   POST /api/billing/verify-payment
 * @access  Private (Institution Billing Admin)
 */
const verifyPayment = async (req, res, next) => {
  try {
    const institutionId = req.institutionScope?.institutionId || req.user.institutionId;
    const orderId = req.body.orderId || req.body.razorpay_order_id;
    const paymentId = req.body.paymentId || req.body.razorpay_payment_id;
    const signature = req.body.signature || req.body.razorpay_signature;
    const targetPlanCode = req.body.targetPlanCode || 'PRO';

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification tokens (orderId, paymentId, signature).',
      });
    }

    const provider = getPaymentProvider('razorpay');
    const isValid = provider.verifyPaymentSignature({ orderId, paymentId, signature });

    let paymentRecord = await Payment.findOne({ providerOrderId: orderId });

    if (!isValid) {
      if (paymentRecord) {
        paymentRecord.status = 'FAILED';
        await paymentRecord.save();
      }

      await AuditLog.create({
        actorId: req.user._id,
        actorRole: req.user.role,
        institutionId: institutionId || null,
        action: 'PAYMENT_FAILED',
        details: { orderId, paymentId, reason: 'Invalid Razorpay payment signature' },
        result: 'FAILURE',
      });

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid cryptographic signature.',
      });
    }

    // Cryptographic Signature Verified Successfully
    const institution = await Institution.findById(institutionId || req.user.institutionId);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution record not found.' });
    }

    // Retrieve active plan document for official price snapshot
    const activePlanDoc = await Plan.findOne({ code: targetPlanCode, status: 'ACTIVE' }).sort({ version: -1 });
    const verifiedAmount = activePlanDoc ? activePlanDoc.price.amount : targetPlanCode === 'BASIC' ? 49999 : targetPlanCode === 'PRO' ? 149999 : 299999;
    const verifiedVersion = activePlanDoc ? activePlanDoc.version : 1;

    if (!paymentRecord) {
      paymentRecord = new Payment({
        institutionId: institution._id,
        planCode: targetPlanCode,
        planVersion: verifiedVersion,
        provider: 'razorpay',
        providerOrderId: orderId,
        amount: verifiedAmount,
        currency: 'INR',
      });
    }

    paymentRecord.providerPaymentId = paymentId;
    paymentRecord.providerSignature = signature;
    paymentRecord.status = 'CAPTURED';
    paymentRecord.paidAt = new Date();
    await paymentRecord.save();

    // Update Subscription Record with Immutable Version & Price Snapshot
    let subscription = await Subscription.findOne({ institutionId: institution._id });
    if (!subscription) {
      subscription = new Subscription({ institutionId: institution._id });
    }

    subscription.status = 'ACTIVE';
    subscription.planCode = targetPlanCode;
    subscription.planVersion = verifiedVersion;
    subscription.priceSnapshot = {
      amount: verifiedAmount,
      currency: activePlanDoc?.price?.currency || 'INR',
      interval: activePlanDoc?.price?.interval || 'annual',
    };
    subscription.providerOrderId = orderId;
    subscription.currentPeriodStart = new Date();
    subscription.currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    subscription.paymentHistory.push({
      paymentId,
      orderId,
      amount: verifiedAmount,
      currency: 'INR',
      planVersion: verifiedVersion,
      status: 'SUCCESS',
      createdAt: new Date(),
    });

    await subscription.save();

    // Update Institution Record
    institution.plan = targetPlanCode;
    institution.subscriptionStatus = 'ACTIVE';
    institution.licenseStatus = 'active';
    institution.subscriptionId = subscription._id;
    await institution.save();

    // Create Invoice Record
    const invoiceNumber = `INV-${institution.tenantId || 'INST'}-${Date.now().toString().slice(-6)}`;
    const invoice = await Invoice.create({
      institutionId: institution._id,
      subscriptionId: subscription._id,
      paymentId: paymentRecord._id,
      invoiceNumber,
      planVersion: verifiedVersion,
      amount: verifiedAmount,
      currency: paymentRecord.currency,
      status: 'PAID',
      issuedAt: new Date(),
      paidAt: new Date(),
      billingDetails: {
        institutionName: institution.name,
        tenantId: institution.tenantId,
        contactEmail: req.user.email,
      },
      lineItems: [
        {
          description: `MAVI Linking ${targetPlanCode} v${verifiedVersion} Institutional Annual Subscription`,
          amount: verifiedAmount,
          periodStart: subscription.currentPeriodStart,
          periodEnd: subscription.currentPeriodEnd,
        },
      ],
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      institutionId: institution._id,
      tenantId: institution.tenantId,
      action: 'PAYMENT_SUCCESS',
      details: {
        paymentId,
        orderId,
        amount: verifiedAmount,
        planCode: targetPlanCode,
        planVersion: verifiedVersion,
        invoiceNumber,
      },
      result: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and subscription activated successfully.',
      data: {
        subscriptionStatus: subscription.status,
        planCode: subscription.planCode,
        planVersion: verifiedVersion,
        priceSnapshot: subscription.priceSnapshot,
        paymentId,
        invoiceNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Public Razorpay Webhook Handler (Raw Body HMAC Signature & Idempotent)
 * @route   POST /api/billing/webhook/razorpay
 * @access  Public (Signature Verified)
 */
const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'] || req.headers['stripe-signature'];
    const provider = getPaymentProvider('razorpay');

    // Webhook Signature Verification using RAW request body
    const rawBody = req.rawBody || req.body;
    if (process.env.NODE_ENV === 'production' || process.env.RAZORPAY_WEBHOOK_SECRET) {
      const isValidSignature = provider.verifyWebhookSignature(rawBody, signature);
      if (!isValidSignature) {
        console.error('[WEBHOOK ERROR] Invalid Razorpay HMAC Signature');
        return res.status(400).json({ success: false, message: 'Invalid payment webhook signature.' });
      }
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const eventType = event.event || event.type || 'payment.captured';
    const eventId = event.event_id || event.id || `evt_${Date.now()}`;

    // IDEMPOTENCY CHECK: Prevent duplicate processing of retry deliveries
    const existingLog = await WebhookLog.findOne({ eventId });
    if (existingLog) {
      console.log(`[WEBHOOK DUPLICATE DETECTED] Event ID ${eventId} already processed.`);
      return res.status(200).json({ status: 'ok', processed: true, idempotency: 'skipped_duplicate' });
    }

    console.log(`[RAZORPAY WEBHOOK RECEIVED] Event: ${eventType} | ID: ${eventId}`);

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const payload = event.payload?.payment?.entity || event.data?.object || event;
      const notes = payload.notes || {};
      const { institutionId, targetPlanCode = 'PRO', planVersion = 1 } = notes;

      if (institutionId) {
        const institution = await Institution.findById(institutionId);
        if (institution) {
          const activePlanDoc = await Plan.findOne({ code: targetPlanCode, status: 'ACTIVE' }).sort({ version: -1 });

          institution.plan = targetPlanCode;
          institution.subscriptionStatus = 'ACTIVE';
          institution.licenseStatus = 'active';
          await institution.save();

          let subscription = await Subscription.findOne({ institutionId: institution._id });
          if (!subscription) {
            subscription = new Subscription({ institutionId: institution._id });
          }

          subscription.status = 'ACTIVE';
          subscription.planCode = targetPlanCode;
          subscription.planVersion = activePlanDoc ? activePlanDoc.version : Number(planVersion) || 1;
          subscription.priceSnapshot = {
            amount: activePlanDoc ? activePlanDoc.price.amount : (payload.amount || 0) / 100,
            currency: payload.currency || 'INR',
            interval: 'annual',
          };
          subscription.currentPeriodStart = new Date();
          subscription.currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          await subscription.save();

          let payment = await Payment.findOne({ providerOrderId: payload.order_id || payload.id });
          if (!payment) {
            payment = new Payment({
              institutionId: institution._id,
              subscriptionId: subscription._id,
              planCode: targetPlanCode,
              planVersion: subscription.planVersion,
              provider: 'razorpay',
              providerPaymentId: payload.id || `pay_${Date.now()}`,
              providerOrderId: payload.order_id || '',
              amount: (payload.amount || 0) / 100 || 149999,
              currency: payload.currency || 'INR',
            });
          }

          payment.status = 'CAPTURED';
          payment.paidAt = new Date();
          await payment.save();

          // Create Invoice if not present
          const existingInvoice = await Invoice.findOne({ paymentId: payment._id });
          if (!existingInvoice) {
            await Invoice.create({
              institutionId: institution._id,
              subscriptionId: subscription._id,
              paymentId: payment._id,
              invoiceNumber: `INV-${institution.tenantId || 'INST'}-${Date.now().toString().slice(-6)}`,
              planVersion: subscription.planVersion,
              amount: payment.amount,
              currency: payment.currency,
              status: 'PAID',
              issuedAt: new Date(),
              paidAt: new Date(),
              billingDetails: { institutionName: institution.name, tenantId: institution.tenantId },
            });
          }

          await AuditLog.create({
            actorRole: 'system',
            institutionId: institution._id,
            tenantId: institution.tenantId,
            action: 'PAYMENT_SUCCESS',
            details: { paymentId: payload.id, amount: payment.amount, planCode: targetPlanCode, planVersion: subscription.planVersion },
            result: 'SUCCESS',
          });
        }
      }
    }

    // Save Webhook Log for Idempotency
    await WebhookLog.create({
      eventId,
      eventType,
      processed: true,
      payload: event,
    });

    res.status(200).json({ status: 'ok', processed: true });
  } catch (error) {
    console.error('[WEBHOOK PROCESSOR ERROR]', error);
    res.status(500).json({ success: false, message: 'Webhook processing error.' });
  }
};

/**
 * @desc    Get institution invoice ledger
 * @route   GET /api/billing/invoices
 * @access  Private (Institution Billing Admin)
 */
const getInvoices = async (req, res, next) => {
  try {
    const institutionId = req.institutionScope?.institutionId || req.user.institutionId;
    if (!institutionId) {
      return res.status(403).json({ success: false, message: 'Forbidden. Institution scope required.' });
    }

    const invoices = await Invoice.find({ institutionId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed invoice receipt by ID
 * @route   GET /api/billing/invoices/:id
 * @access  Private (Institution Billing Admin)
 */
const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const institutionId = req.institutionScope?.institutionId || req.user.institutionId;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (institutionId && invoice.institutionId.toString() !== institutionId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. Access denied for another institution invoice.' });
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel institution subscription at period end
 * @route   POST /api/billing/cancel-subscription
 * @access  Private (Institution Billing Admin)
 */
const cancelSubscription = async (req, res, next) => {
  try {
    const institutionId = req.institutionScope?.institutionId || req.user.institutionId;
    if (!institutionId) {
      return res.status(403).json({ success: false, message: 'Forbidden. Institution scope required.' });
    }

    const subscription = await Subscription.findOne({ institutionId });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription record not found.' });
    }

    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      institutionId,
      action: 'SUBSCRIPTION_CANCELLED',
      details: { cancelAtPeriodEnd: true, periodEnd: subscription.currentPeriodEnd },
      result: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: `Subscription scheduled for cancellation on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}. Institutional data remains safe.`,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Direct Razorpay Order Creation Endpoint (Standard Checkout)
 * @route   POST /api/create-order
 * @access  Public / Protected
 */
const createOrderDirect = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    const amountInPaise = Number(amount);

    if (!amountInPaise || isNaN(amountInPaise) || amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Minimum amount required is 100 paise (₹1.00).',
      });
    }

    const provider = getPaymentProvider('razorpay');
    const order = await provider.createOrder({
      amount: amountInPaise / 100, // convert paise to rupees
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    });

    res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('[CREATE ORDER DIRECT ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Razorpay order creation failed.',
    });
  }
};

/**
 * @desc    Direct Razorpay Signature Verification Endpoint (Standard Checkout)
 * @route   POST /api/verify-payment
 * @access  Public / Protected
 */
const verifyPaymentDirect = async (req, res, next) => {
  try {
    const razorpay_order_id = req.body.razorpay_order_id || req.body.orderId;
    const razorpay_payment_id = req.body.razorpay_payment_id || req.body.paymentId;
    const razorpay_signature = req.body.razorpay_signature || req.body.signature;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: razorpay_order_id, razorpay_payment_id, razorpay_signature.',
      });
    }

    const provider = getPaymentProvider('razorpay');
    const isValid = provider.verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Razorpay payment signature. Payment verification failed.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Razorpay payment signature verified successfully.',
      data: {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
      },
    });
  } catch (error) {
    console.error('[VERIFY PAYMENT DIRECT ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed.',
    });
  }
};

// ─── PLATFORM OWNER COMMERCIAL SAAS CATALOG CONTROLLERS ───────────────────

/**
 * @desc    Get all SaaS Catalog Plans (Drafts, Active, Inactive, Archived, and Versions)
 * @route   GET /api/owner/plans
 * @access  Private (Platform Owner)
 */
const getOwnerPlans = async (req, res, next) => {
  try {
    await seedDefaultPlansIfEmpty();
    const plans = await Plan.find().sort({ code: 1, version: -1 });

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new commercial SaaS Plan Tier
 * @route   POST /api/owner/plans
 * @access  Private (Platform Owner ONLY)
 */
const createOwnerPlan = async (req, res, next) => {
  try {
    const { name, code, description, price, limits, features, status = 'ACTIVE' } = req.body;

    if (!name || !code || !price?.amount) {
      return res.status(400).json({ success: false, message: 'Plan name, code, and price amount are required.' });
    }

    const upperCode = code.toUpperCase();
    await Plan.collection.dropIndex('code_1').catch(() => {});
    const existingCount = await Plan.countDocuments({ code: upperCode });

    const newPlan = await Plan.create({
      name: name.trim(),
      code: upperCode,
      version: existingCount + 1,
      description: description || '',
      price: {
        amount: Number(price.amount),
        currency: price.currency || 'INR',
        interval: price.interval || 'annual',
      },
      limits: limits || {},
      features: features || {},
      status,
      createdBy: req.user._id,
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'PLAN_CREATED',
      details: { planId: newPlan._id, code: newPlan.code, version: newPlan.version, price: newPlan.price },
      result: 'SUCCESS',
    });

    res.status(201).json({
      success: true,
      message: `Plan '${newPlan.name}' v${newPlan.version} created successfully.`,
      data: newPlan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Edit Plan & Create New Version Snapshot if price or limits change
 * @route   PUT /api/owner/plans/:id
 * @access  Private (Platform Owner ONLY)
 */
const updateOwnerPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, limits, features, status } = req.body;

    const existingPlan = await Plan.findById(id);
    if (!existingPlan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    const priceChanged = price?.amount !== undefined && Number(price.amount) !== existingPlan.price.amount;
    const limitsChanged = limits && JSON.stringify(limits) !== JSON.stringify(existingPlan.limits);

    if (priceChanged || limitsChanged) {
      await Plan.collection.dropIndex('code_1').catch(() => {});
      // PLAN VERSIONING: Increment version and preserve historical version document
      const maxVersionPlan = await Plan.findOne({ code: existingPlan.code }).sort({ version: -1 });
      const nextVersion = (maxVersionPlan ? maxVersionPlan.version : existingPlan.version) + 1;

      // Deactivate/Archive previous version if active
      if (existingPlan.status === 'ACTIVE') {
        existingPlan.status = 'INACTIVE';
        await existingPlan.save();
      }

      const versionedPlan = await Plan.create({
        name: name ? name.trim() : existingPlan.name,
        code: existingPlan.code,
        version: nextVersion,
        description: description !== undefined ? description : existingPlan.description,
        price: {
          amount: price?.amount !== undefined ? Number(price.amount) : existingPlan.price.amount,
          currency: price?.currency || existingPlan.price.currency,
          interval: price?.interval || existingPlan.price.interval,
        },
        limits: limits ? { ...existingPlan.limits.toObject(), ...limits } : existingPlan.limits,
        features: features ? { ...existingPlan.features.toObject(), ...features } : existingPlan.features,
        status: status || 'ACTIVE',
        createdBy: req.user._id,
      });

      await AuditLog.create({
        actorId: req.user._id,
        actorRole: req.user.role,
        action: 'PLAN_VERSION_CREATED',
        details: {
          code: versionedPlan.code,
          oldVersion: existingPlan.version,
          newVersion: versionedPlan.version,
          oldPrice: existingPlan.price.amount,
          newPrice: versionedPlan.price.amount,
        },
        result: 'SUCCESS',
      });

      return res.status(200).json({
        success: true,
        message: `Plan '${versionedPlan.name}' updated to version v${versionedPlan.version}. Existing subscriptions retain historical price.`,
        data: versionedPlan,
      });
    }

    // Minor metadata edit without price/version change
    if (name) existingPlan.name = name.trim();
    if (description !== undefined) existingPlan.description = description;
    if (features) existingPlan.features = { ...existingPlan.features.toObject(), ...features };
    if (status) existingPlan.status = status;

    await existingPlan.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'PLAN_UPDATED',
      details: { planId: existingPlan._id, code: existingPlan.code, version: existingPlan.version },
      result: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: `Plan '${existingPlan.name}' v${existingPlan.version} updated.`,
      data: existingPlan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Publish / Unpublish / Archive Plan Status
 * @route   PATCH /api/owner/plans/:id/status
 * @access  Private (Platform Owner ONLY)
 */
const setOwnerPlanStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid plan status value.' });
    }

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    const oldStatus = plan.status;
    plan.status = status;
    if (status === 'ACTIVE') plan.publishedAt = new Date();
    await plan.save();

    const action = status === 'ACTIVE' ? 'PLAN_PUBLISHED' : status === 'ARCHIVED' ? 'PLAN_ARCHIVED' : 'PLAN_UNPUBLISHED';

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action,
      details: { planId: plan._id, code: plan.code, version: plan.version, oldStatus, newStatus: status },
      result: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: `Plan '${plan.name}' status set to ${status}.`,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Global SaaS Billing & Revenue Overview for Platform Owner
 * @route   GET /api/owner/billing/overview
 * @access  Private (Platform Owner ONLY)
 */
const getOwnerBillingOverview = async (req, res, next) => {
  try {
    const [institutionsCount, subscriptions, payments, invoices] = await Promise.all([
      Institution.countDocuments(),
      Subscription.find().populate('institutionId', 'name code tenantId'),
      Payment.find().populate('institutionId', 'name code tenantId').sort({ createdAt: -1 }),
      Invoice.find().sort({ createdAt: -1 }),
    ]);

    const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
    const successfulPayments = payments.filter((p) => p.status === 'CAPTURED' || p.status === 'SUCCESS');
    const failedPayments = payments.filter((p) => p.status === 'FAILED');

    const totalRevenue = successfulPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalInstitutions: institutionsCount,
          activeSubscriptions: activeSubs.length,
          totalPaymentsCount: payments.length,
          successfulPaymentsCount: successfulPayments.length,
          failedPaymentsCount: failedPayments.length,
          totalRevenue,
        },
        subscriptions: subscriptions.map((s) => ({
          id: s._id,
          institution: s.institutionId?.name || 'Unknown',
          tenantId: s.institutionId?.tenantId || '',
          planCode: s.planCode,
          planVersion: s.planVersion || 1,
          priceSnapshot: s.priceSnapshot || { amount: 0 },
          status: s.status,
          currentPeriodEnd: s.currentPeriodEnd,
        })),
        payments: payments.map((p) => ({
          id: p._id,
          institution: p.institutionId?.name || 'Unknown',
          paymentId: p.providerPaymentId || p._id.toString(),
          orderId: p.providerOrderId,
          amount: p.amount,
          currency: p.currency,
          planCode: p.planCode,
          planVersion: p.planVersion || 1,
          status: p.status,
          createdAt: p.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── SUPER ADMIN BILLING OVERSIGHT CONTROLLERS ────────────────────────────

/**
 * @desc    Super Admin Institution Subscription & Billing Matrix
 * @route   GET /api/super-admin/billing/institutions
 * @access  Private (Super Admin)
 */
const getSuperAdminBillingOverview = async (req, res, next) => {
  try {
    await seedDefaultPlansIfEmpty();
    const [publishedPlans, institutions, subscriptions, payments] = await Promise.all([
      Plan.find({ status: 'ACTIVE' }).sort({ code: 1, version: -1 }),
      Institution.find().select('name code tenantId plan subscriptionStatus createdAt'),
      Subscription.find().populate('institutionId', 'name tenantId'),
      Payment.find().sort({ createdAt: -1 }),
    ]);

    const matrix = institutions.map((inst) => {
      const sub = subscriptions.find((s) => s.institutionId?._id?.toString() === inst._id.toString());
      const instPayments = payments.filter((p) => p.institutionId?.toString() === inst._id.toString());
      const lastPayment = instPayments[0];

      return {
        institutionId: inst._id,
        name: inst.name,
        code: inst.code,
        tenantId: inst.tenantId,
        plan: inst.plan || 'ENTERPRISE',
        planVersion: sub ? sub.planVersion || 1 : 1,
        priceSnapshot: sub?.priceSnapshot || { amount: inst.plan === 'BASIC' ? 49999 : inst.plan === 'PRO' ? 149999 : 299999, currency: 'INR' },
        subscriptionStatus: sub ? sub.status : inst.subscriptionStatus || 'ACTIVE',
        paymentStatus: lastPayment ? lastPayment.status : 'SUCCESS',
        lastPaymentDate: lastPayment ? lastPayment.createdAt : inst.createdAt,
        renewalDate: sub ? sub.currentPeriodEnd : null,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        publishedPlans,
        institutions: matrix,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Super Admin Assign / Publish Available Plan to Institution (Official Price)
 * @route   POST /api/super-admin/billing/assign-plan
 * @access  Private (Super Admin)
 */
const assignInstitutionPlan = async (req, res, next) => {
  try {
    const { targetInstitutionId, planCode } = req.body;

    if (!targetInstitutionId || !planCode) {
      return res.status(400).json({ success: false, message: 'Target Institution ID and planCode are required.' });
    }

    const institution = await Institution.findById(targetInstitutionId);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    // Retrieve active plan document for official price snapshot
    const activePlan = await Plan.findOne({ code: planCode, status: 'ACTIVE' }).sort({ version: -1 });
    if (!activePlan) {
      return res.status(404).json({ success: false, message: `Active plan '${planCode}' not found in SaaS catalog.` });
    }

    institution.plan = planCode;
    institution.subscriptionStatus = 'ACTIVE';
    institution.licenseStatus = 'active';
    await institution.save();

    let subscription = await Subscription.findOne({ institutionId: institution._id });
    if (!subscription) {
      subscription = new Subscription({ institutionId: institution._id });
    }

    subscription.status = 'ACTIVE';
    subscription.planCode = planCode;
    subscription.planVersion = activePlan.version;
    subscription.priceSnapshot = activePlan.price;
    subscription.currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await subscription.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      institutionId: institution._id,
      tenantId: institution.tenantId,
      action: 'INSTITUTION_PLAN_ASSIGNED',
      details: { planCode, planVersion: activePlan.version, price: activePlan.price.amount },
      result: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: `Assigned plan '${planCode}' v${activePlan.version} to institution ${institution.name}.`,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublishedPlans,
  getInstitutionBilling,
  createCheckoutSession,
  verifyPayment,
  handleWebhook,
  getInvoices,
  getInvoiceById,
  cancelSubscription,
  createOrderDirect,
  verifyPaymentDirect,
  getOwnerPlans,
  createOwnerPlan,
  updateOwnerPlan,
  setOwnerPlanStatus,
  getOwnerBillingOverview,
  getSuperAdminBillingOverview,
  assignInstitutionPlan,
};
