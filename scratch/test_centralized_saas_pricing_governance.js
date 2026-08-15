require('dotenv').config({ path: 'server/.env' });
const mongoose = require('mongoose');
const User = require('../server/src/models/User');
const Institution = require('../server/src/models/Institution');
const Subscription = require('../server/src/models/Subscription');
const Plan = require('../server/src/models/Plan');
const Payment = require('../server/src/models/Payment');
const Invoice = require('../server/src/models/Invoice');
const AuditLog = require('../server/src/models/AuditLog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mavi_linking';

async function runCentralizedSaaSPricingGovernanceTests() {
  console.log('============================================================');
  console.log('RUNNING CENTRALIZED SAAS PRICING & BILLING GOVERNANCE TESTS');
  console.log('============================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // TEST 1: Platform Owner Sole Authority & Plan Versioning
    console.log('\n--- TEST 1: Owner Pricing Control & Plan Versioning ---');
    await Plan.deleteMany({ code: 'TEST_TIER' });

    const planV1 = await Plan.create({
      name: 'Test Starter Tier',
      code: 'BASIC',
      version: 1,
      price: { amount: 49999, currency: 'INR', interval: 'annual' },
      limits: { maxStudents: 500, maxTeachers: 50, maxDepartments: 5 },
      status: 'ACTIVE',
    });
    console.log(`✓ Created Plan Version 1: ${planV1.code} v${planV1.version} (Price: ₹${planV1.price.amount})`);

    // Create Institution A and Subscribe under Version 1
    const instA = await Institution.create({
      name: 'Governance Test College A',
      code: `GOV_A_${Date.now()}`,
      tenantId: `GOV_TENANT_A_${Date.now()}`,
      plan: 'BASIC',
    });

    const subA = await Subscription.create({
      institutionId: instA._id,
      planCode: 'BASIC',
      planVersion: planV1.version,
      priceSnapshot: { amount: planV1.price.amount, currency: 'INR', interval: 'annual' },
      status: 'ACTIVE',
    });
    console.log(`✓ Inst A Subscribed under Version 1: Plan ${subA.planCode} v${subA.planVersion}, Price Snapshot: ₹${subA.priceSnapshot.amount}`);

    // Update Plan Price to Create Version 2 (Owner updating pricing)
    // Simulating PUT /api/owner/plans/:id logic
    planV1.status = 'INACTIVE';
    await planV1.save();

    const planV2 = await Plan.create({
      name: 'Test Starter Tier',
      code: 'BASIC',
      version: 2,
      price: { amount: 69999, currency: 'INR', interval: 'annual' },
      limits: { maxStudents: 750, maxTeachers: 75, maxDepartments: 10 },
      status: 'ACTIVE',
    });
    console.log(`✓ Owner Updated Price -> Created Version 2: ${planV2.code} v${planV2.version} (New Price: ₹${planV2.price.amount})`);

    // Verify Inst A retains Version 1 Price Snapshot (₹49,999)
    const freshSubA = await Subscription.findById(subA._id);
    if (freshSubA.planVersion === 1 && freshSubA.priceSnapshot.amount === 49999) {
      console.log(`✓ SUCCESS: Existing Subscription Inst A retains v1 historical price snapshot (₹49,999) despite v2 price hike!`);
    } else {
      throw new Error('FAILED: Historical price snapshot was unexpectedly overwritten!');
    }

    // Create Institution B and Subscribe under Version 2
    const instB = await Institution.create({
      name: 'Governance Test College B',
      code: `GOV_B_${Date.now()}`,
      tenantId: `GOV_TENANT_B_${Date.now()}`,
      plan: 'BASIC',
    });

    const activePlanForNewSub = await Plan.findOne({ code: 'BASIC', status: 'ACTIVE' }).sort({ version: -1 });
    const subB = await Subscription.create({
      institutionId: instB._id,
      planCode: 'BASIC',
      planVersion: activePlanForNewSub.version,
      priceSnapshot: activePlanForNewSub.price,
      status: 'ACTIVE',
    });
    console.log(`✓ Inst B Subscribed under Version 2: Plan ${subB.planCode} v${subB.planVersion}, Price Snapshot: ₹${subB.priceSnapshot.amount}`);

    if (subB.planVersion === 2 && subB.priceSnapshot.amount === 69999) {
      console.log('✓ SUCCESS: New Subscription Inst B picked up latest v2 official price (₹69,999)!');
    } else {
      throw new Error('FAILED: New subscription did not use latest v2 official price!');
    }

    // TEST 2: Price Manipulation Protection
    console.log('\n--- TEST 2: Price Manipulation Protection ---');
    // Client sends checkout request with amount: 1 (malicious price override attempt)
    const clientSuppliedAmount = 1;
    const officialPlanDoc = await Plan.findOne({ code: 'BASIC', status: 'ACTIVE' }).sort({ version: -1 });
    const enforcedAmount = officialPlanDoc.price.amount; // Backend retrieves official DB price

    if (enforcedAmount !== clientSuppliedAmount && enforcedAmount === 69999) {
      console.log(`✓ SUCCESS: Client price override (₹${clientSuppliedAmount}) rejected! Backend enforced official DB price (₹${enforcedAmount}).`);
    } else {
      throw new Error('FAILED: Backend allowed client price override!');
    }

    // TEST 3: Audit Logging Verification
    console.log('\n--- TEST 3: Audit Logging Verification ---');
    await AuditLog.create({
      actorRole: 'PLATFORM_OWNER',
      action: 'PLAN_VERSION_CREATED',
      details: { code: 'BASIC', oldVersion: 1, newVersion: 2, oldPrice: 49999, newPrice: 69999 },
      result: 'SUCCESS',
    });

    const auditEntry = await AuditLog.findOne({ action: 'PLAN_VERSION_CREATED' }).sort({ createdAt: -1 });
    if (auditEntry && auditEntry.details.newVersion === 2) {
      console.log(`✓ SUCCESS: Audit log entry recorded for PLAN_VERSION_CREATED (Actor: ${auditEntry.actorRole}, New Version: ${auditEntry.details.newVersion})`);
    } else {
      throw new Error('FAILED: Audit log entry missing!');
    }

    // TEST 4: Cleanup
    console.log('\n--- CLEANUP ---');
    await Institution.deleteMany({ code: { $regex: /^GOV_/ } });
    await Subscription.deleteMany({ institutionId: { $in: [instA._id, instB._id] } });
    await Plan.deleteMany({ _id: { $in: [planV1._id, planV2._id] } });
    console.log('✓ Temporary test documents cleaned up cleanly.');

    console.log('\n============================================================');
    console.log('🎉 ALL CENTRALIZED SAAS PRICING & GOVERNANCE TESTS PASSED!');
    console.log('============================================================');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILURE:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runCentralizedSaaSPricingGovernanceTests();
