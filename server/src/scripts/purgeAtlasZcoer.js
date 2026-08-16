const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Institution = require('../models/Institution');
const Department = require('../models/Department');
const User = require('../models/User');
const InstitutionMembership = require('../models/InstitutionMembership');

async function purgeAtlasZcoer() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment.');
    process.exit(1);
  }

  console.log('\n============================================================');
  console.log('CONNECTING TO MONGODB ATLAS CLOUD DATABASE...');
  console.log('============================================================');

  await mongoose.connect(uri);
  console.log(`✅ Connected to Cloud Database: "${mongoose.connection.name}"`);

  const regexList = [/ZCOER/i, /zcoer\.in/i, /ZEAL/i];
  const query = {
    $or: [
      { tenantId: { $in: regexList } },
      { institutionCode: { $in: regexList } },
      { code: { $in: regexList } },
      { domain: { $in: regexList } },
      { officialDomain: { $in: regexList } },
      { name: { $in: regexList } },
    ],
  };

  const insts = await Institution.find(query);
  console.log(`\n🔍 Found ${insts.length} matching institution(s) in Atlas Cloud Database.`);

  for (const inst of insts) {
    console.log(`\n🗑️ Deleting Institution: "${inst.name}"`);
    console.log(`   ID: ${inst._id}`);
    console.log(`   Tenant ID / Code: ${inst.tenantId || inst.institutionCode || inst.code}`);
    console.log(`   Domain: ${inst.officialDomain || inst.domain || 'N/A'}`);
    console.log(`   Status: ${inst.status}`);

    const instId = inst._id;
    const deptsDel = await Department.deleteMany({ institutionId: instId });
    const usersDel = await User.deleteMany({ institutionId: instId });
    const memsDel = await InstitutionMembership.deleteMany({ institutionId: instId });
    const instDel = await Institution.deleteOne({ _id: instId });

    console.log(`   ✓ Deleted Institution document: ${instDel.deletedCount}`);
    console.log(`   ✓ Deleted associated Departments: ${deptsDel.deletedCount}`);
    console.log(`   ✓ Deleted associated Users: ${usersDel.deletedCount}`);
    console.log(`   ✓ Deleted associated Memberships: ${memsDel.deletedCount}`);
  }

  // Also purge any orphaned users or departments with university name matching ZEAL
  const orphanedUsers = await User.deleteMany({ 'university.name': { $in: regexList } });
  console.log(`   ✓ Cleaned orphaned users matching ZEAL: ${orphanedUsers.deletedCount}`);

  // List remaining institutions in MongoDB Atlas Cloud DB
  const remainingInsts = await Institution.find({}).select('name tenantId institutionCode domain status');
  console.log(`\n📊 REMAINING INSTITUTIONS IN CLOUD DATABASE (${remainingInsts.length} total):`);
  remainingInsts.forEach((inst, i) => {
    console.log(`  ${i + 1}. "${inst.name}" | Code: ${inst.institutionCode || inst.tenantId} | Domain: ${inst.domain || 'N/A'} | Status: ${inst.status}`);
  });

  console.log('\n============================================================');
  console.log('✅ ATLAS CLOUD DATABASE PURGE COMPLETED SUCCESSFULLY!');
  console.log('============================================================\n');

  await mongoose.disconnect();
}

purgeAtlasZcoer().catch((err) => {
  console.error('❌ Error during Atlas purge:', err);
  if (mongoose.connection.readyState !== 0) mongoose.disconnect();
  process.exit(1);
});
