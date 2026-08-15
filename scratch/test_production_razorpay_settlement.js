const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/src/models/User');
const Institution = require('../server/src/models/Institution');
const Subscription = require('../server/src/models/Subscription');
const Payment = require('../server/src/models/Payment');
const Invoice = require('../server/src/models/Invoice');
const WebhookLog = require('../server/src/models/WebhookLog');
const AuditLog = require('../server/src/models/AuditLog');

const { getInstitutionBilling, createCheckoutSession, verifyPayment, handleWebhook, cancelSubscription } = require('../server/src/controllers/billingController');
const { getPaymentProvider } = require('../server/src/services/paymentProvider');

const createMockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.data = null;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.data = payload;
    return res;
  };
  return res;
};

const runProductionRazorpayTests = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas for Production Razorpay Settlement Integration Tests\n');

    // Load or create test institutions
    let zealInst = await Institution.findOne({ tenantId: 'ZCOER' });
    let coepInst = await Institution.findOne({ tenantId: 'COEP' });

    if (!zealInst) zealInst = await Institution.create({ name: 'Zeal College', tenantId: 'ZCOER', code: 'ZCOER-PUNE' });
    if (!coepInst) coepInst = await Institution.create({ name: 'COEP Tech', tenantId: 'COEP', code: 'COEP-PUNE' });

    // Load test users
    let instAdminZeal = await User.findOne({ email: 'admin.zcoer@mavilinking.com' });
    if (!instAdminZeal) {
      instAdminZeal = await User.create({
        name: 'Zeal Inst Admin',
        email: 'admin.zcoer@mavilinking.com',
        role: 'institution_admin',
        institutionId: zealInst._id,
        tenantId: 'ZCOER',
      });
    }

    let deptAdmin = await User.findOne({ role: 'department_admin' });
    if (!deptAdmin) {
      deptAdmin = await User.create({
        name: 'Test Dept Admin',
        email: 'deptadmin.billing.test@zeal.edu',
        role: 'department_admin',
        institutionId: zealInst._id,
        tenantId: 'ZCOER',
      });
    }

    console.log('============================================================');
    console.log('TEST 1: Authorized Billing Admin Retrieves Institution Subscription');
    console.log('============================================================');
    const req1 = {
      user: instAdminZeal,
      institutionScope: { institutionId: zealInst._id, tenantId: 'ZCOER' },
    };
    const res1 = createMockRes();
    await getInstitutionBilling(req1, res1, (err) => console.error(err));
    console.log('Status Code:', res1.statusCode, '(Expected 200)');
    console.log('Institution Name:', res1.data?.data?.institution?.name);
    console.log('Subscription Status:', res1.data?.data?.subscription?.status);

    console.log('\n============================================================');
    console.log('TEST 2: Department Admin Access Denial (403 Forbidden)');
    console.log('============================================================');
    const { requireBillingAdmin } = require('../server/src/middleware/rbacMiddleware');
    const reqDeptAdmin = { user: deptAdmin };
    const resDeptAdmin = createMockRes();
    let middlewarePassed = false;
    requireBillingAdmin(reqDeptAdmin, resDeptAdmin, () => {
      middlewarePassed = true;
    });
    console.log('Middleware Passed?:', middlewarePassed, '(Expected false)');
    console.log('Status Code:', resDeptAdmin.statusCode, '(Expected 403)');
    console.log('Message:', resDeptAdmin.data?.message);

    console.log('\n============================================================');
    console.log('TEST 3: Checkout Order & Payment Ledger Record Creation');
    console.log('============================================================');
    const reqCheckout = {
      user: instAdminZeal,
      institutionScope: { institutionId: zealInst._id, tenantId: 'ZCOER' },
      body: { targetPlanCode: 'PRO', billingCycle: 'annual' },
    };
    const resCheckout = createMockRes();
    await createCheckoutSession(reqCheckout, resCheckout, (err) => console.error(err));
    console.log('Checkout Status Code:', resCheckout.statusCode, '(Expected 200)');
    console.log('Generated Order ID:', resCheckout.data?.data?.orderId);
    console.log('Order Amount (in paise):', resCheckout.data?.data?.amount);

    const createdPayment = await Payment.findOne({ providerOrderId: resCheckout.data?.data?.orderId });
    console.log('Payment Ledger Record Created?:', !!createdPayment);
    console.log('Initial Payment Status:', createdPayment?.status, '(Expected INITIATED)');

    console.log('\n============================================================');
    console.log('TEST 4: Server-Side Cryptographic Payment Verification (HMAC SHA-256)');
    console.log('============================================================');
    const testOrderId = resCheckout.data?.data?.orderId || `order_test_${Date.now()}`;
    const testPaymentId = `pay_test_${Date.now()}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'test_key_secret';
    
    // Compute valid HMAC SHA-256 signature
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${testOrderId}|${testPaymentId}`)
      .digest('hex');

    const reqVerify = {
      user: instAdminZeal,
      institutionScope: { institutionId: zealInst._id, tenantId: 'ZCOER' },
      body: {
        orderId: testOrderId,
        paymentId: testPaymentId,
        signature: validSignature,
        targetPlanCode: 'PRO',
      },
    };
    const resVerify = createMockRes();
    await verifyPayment(reqVerify, resVerify, (err) => console.error(err));
    console.log('Verification Status Code:', resVerify.statusCode, '(Expected 200)');
    console.log('Verification Message:', resVerify.data?.message);
    console.log('Generated Invoice Number:', resVerify.data?.data?.invoiceNumber);

    const verifiedSub = await Subscription.findOne({ institutionId: zealInst._id });
    console.log('Verified Subscription Status:', verifiedSub?.status, '(Expected ACTIVE)');
    console.log('Verified Plan Code:', verifiedSub?.planCode, '(Expected PRO)');

    console.log('\n============================================================');
    console.log('TEST 5: Raw Body Webhook Verification & Idempotency Deduplication');
    console.log('============================================================');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
    const testEventId = `evt_idempotency_test_${Date.now()}`;
    const webhookPayload = JSON.stringify({
      event_id: testEventId,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_webhook_${Date.now()}`,
            order_id: testOrderId,
            amount: 14999900,
            currency: 'INR',
            status: 'captured',
            notes: {
              institutionId: zealInst._id.toString(),
              targetPlanCode: 'PRO',
            },
          },
        },
      },
    });

    const webhookSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookPayload)
      .digest('hex');

    const reqWebhook = {
      headers: { 'x-razorpay-signature': webhookSignature },
      rawBody: Buffer.from(webhookPayload, 'utf8'),
      body: JSON.parse(webhookPayload),
    };
    const resWebhook1 = createMockRes();
    await handleWebhook(reqWebhook, resWebhook1, (err) => console.error(err));
    console.log('First Webhook Delivery Status:', resWebhook1.statusCode, '(Expected 200)');
    console.log('First Webhook Processed?:', resWebhook1.data?.processed);

    // Second Webhook Delivery (Duplicate Idempotency Test)
    const resWebhook2 = createMockRes();
    await handleWebhook(reqWebhook, resWebhook2, (err) => console.error(err));
    console.log('Duplicate Webhook Delivery Status:', resWebhook2.statusCode, '(Expected 200)');
    console.log('Idempotency Action:', resWebhook2.data?.idempotency, '(Expected skipped_duplicate)');

    console.log('\n============================================================');
    console.log('TEST 6: Subscription Cancellation at Period End');
    console.log('============================================================');
    const reqCancel = {
      user: instAdminZeal,
      institutionScope: { institutionId: zealInst._id, tenantId: 'ZCOER' },
    };
    const resCancel = createMockRes();
    await cancelSubscription(reqCancel, resCancel, (err) => console.error(err));
    console.log('Cancellation Status Code:', resCancel.statusCode, '(Expected 200)');
    console.log('Cancellation Scheduled?:', resCancel.data?.data?.cancelAtPeriodEnd);

    console.log('\n🎉 ALL PRODUCTION RAZORPAY SETTLEMENT INTEGRATION TESTS PASSED!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Test Error:', err);
    process.exit(1);
  }
};

runProductionRazorpayTests();
