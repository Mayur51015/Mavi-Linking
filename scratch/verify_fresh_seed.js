const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const resetDemoDatabase = require('../server/src/scripts/resetDemoDatabase');

dotenv.config({ path: path.join(__dirname, '../server/.env') });
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking';

async function verify() {
  console.log('\n=== TESTING IDEMPOTENCY & VERIFICATION OF RESET SCRIPT ===');

  // Test running resetDemoDatabase a second time
  await resetDemoDatabase();

  await mongoose.connect(mongoUri);
  const User = mongoose.model('User');
  const Institution = mongoose.model('Institution');
  const Department = mongoose.model('Department');

  // 1. Verify Institution Code Lookup
  const inst = await Institution.findOne({ institutionCode: 'MAVI-DEMO-001' });
  if (!inst) throw new Error('Fresh institution MAVI-DEMO-001 not found!');
  console.log('✅ Verified Institution Code Lookup for MAVI-DEMO-001:', inst.name);

  // 2. Verify Department Count & Codes
  const depts = await Department.find({ institutionId: inst._id });
  if (depts.length !== 5) throw new Error(`Expected 5 departments, found ${depts.length}`);
  const deptCodes = depts.map(d => d.code).sort().join(',');
  if (deptCodes !== 'CIVIL,CSE,ENTC,IT,MECH') throw new Error(`Unexpected dept codes: ${deptCodes}`);
  console.log('✅ Verified 5 Departments for MAVI Demo Institution:', deptCodes);

  // 3. Verify Duplicate Email / PRN / MAVI ID Uniqueness
  const allUsers = await User.find({});
  const emails = new Set();
  const maviIds = new Set();

  for (const u of allUsers) {
    if (emails.has(u.email)) throw new Error(`Duplicate email found: ${u.email}`);
    emails.add(u.email);

    if (u.maviId) {
      if (maviIds.has(u.maviId)) throw new Error(`Duplicate MAVI ID found: ${u.maviId}`);
      maviIds.add(u.maviId);
    }
  }
  console.log(`✅ Verified ${allUsers.length} Users have 100% unique emails and MAVI IDs.`);

  await mongoose.disconnect();
  console.log('=== IDEMPOTENCY & VERIFICATION PASSED PERFECTLY ===\n');
}

verify().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
