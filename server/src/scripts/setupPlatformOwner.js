const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const User = require('../models/User');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const targetEmail = (process.env.PLATFORM_OWNER_EMAIL || process.env.SUPER_ADMIN_EMAIL || 'owner@edutalentx.com').toLowerCase().trim();
  const targetPassword = process.env.PLATFORM_OWNER_PASSWORD || process.env.SUPER_ADMIN_PASSWORD || 'OwnerPass@123';
  const targetName = process.env.PLATFORM_OWNER_NAME || process.env.SUPER_ADMIN_NAME || 'Platform Owner';

  // 1. Delete old test accounts
  const delTest = await User.deleteMany({ email: 'student.test@example.com' });
  console.log('Deleted test accounts:', delTest.deletedCount);

  // 2. Clean old ETX-OWNER01 non-matching
  const delOldEtx = await User.deleteMany({ etxId: 'ETX-OWNER01', email: { $ne: targetEmail } });
  console.log('Cleaned old ETX-OWNER01 non-matching:', delOldEtx.deletedCount);

  // 3. Create or update Platform Owner account
  let owner = await User.findOne({ email: targetEmail });
  if (owner) {
    owner.name = targetName;
    owner.password = targetPassword;
    owner.role = 'super_admin';
    owner.roles = ['super_admin', 'admin', 'user', 'owner', 'platform_owner'];
    owner.adminId = 'ETX-OWNER-001';
    owner.adminLoginId = 'ETX-OWNER-001';
    owner.designation = 'Platform Owner & Founder';
    owner.etxId = 'ETX-OWNER01';
    owner.status = 'active';
    owner.accountStatus = 'ACTIVE';
    owner.emailVerified = true;
    await owner.save();
    console.log(`Updated platform owner account successfully: ${targetEmail}`);
  } else {
    owner = await User.create({
      name: targetName,
      email: targetEmail,
      password: targetPassword,
      role: 'super_admin',
      roles: ['super_admin', 'admin', 'user', 'owner', 'platform_owner'],
      adminId: 'ETX-OWNER-001',
      adminLoginId: 'ETX-OWNER-001',
      designation: 'Platform Owner & Founder',
      etxId: 'ETX-OWNER01',
      status: 'active',
      accountStatus: 'ACTIVE',
      emailVerified: true,
    });
    console.log(`Created platform owner account successfully: ${targetEmail}`);
  }

  // 5. Query all users in DB to verify
  const remaining = await User.find({}, 'name email role roles accountStatus etxId').lean();
  console.log('\nREMAINING USERS IN DATABASE (' + remaining.length + '):');
  remaining.forEach(u => {
    console.log(` - ${u.email} [${u.role}] (etxId: ${u.etxId}, status: ${u.accountStatus})`);
  });

  await mongoose.disconnect();
  console.log('\nDatabase disconnected cleanly.');
}

run().catch(err => {
  console.error('Error running setupPlatformOwner:', err);
  process.exit(1);
});
