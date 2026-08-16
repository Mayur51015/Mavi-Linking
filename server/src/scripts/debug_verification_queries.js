require('dotenv').config();
const mongoose = require('mongoose');
require('../models/Institution');
require('../models/Department');
const User = require('../models/User');

async function debugQueries() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Query 1: Standard admin query for PRN verifications
  console.log('\n--- 1. ADMIN CONTROLLER PRN VERIFICATION QUERY ---');
  const adminPrnUsers = await User.find({
    $or: [
      { prnVerificationStatus: 'pending' },
      { accountStatus: 'PENDING_ADMIN_APPROVAL' },
      { accountStatus: 'PENDING_VERIFICATION' },
      { roleStatus: 'pending' }
    ]
  }).select('name email maviId prn role accountStatus prnVerificationStatus roleStatus institutionId departmentId');

  console.log(`Found ${adminPrnUsers.length} pending users matching Admin query:`);
  adminPrnUsers.forEach((u, i) => {
    console.log(`[${i + 1}] Name: ${u.name} | Email: ${u.email} | MAVI ID: ${u.maviId} | PRN: ${u.prn} | Status: ${u.accountStatus} | PRNStatus: ${u.prnVerificationStatus} | Inst: ${u.institutionId}`);
  });

  // Query 2: Check institution filtering
  console.log('\n--- 2. CHECKING INSTITUTIONS IN DATABASE ---');
  const Institution = require('../models/Institution');
  const institutions = await Institution.find();
  console.log(`Found ${institutions.length} institutions:`, institutions.map(i => ({ id: i._id, name: i.name, code: i.code })));

  // Query 3: Check Super Admin query
  console.log('\n--- 3. SUPER ADMIN PENDING ROLE REQUESTS QUERY ---');
  const pendingRoles = await User.find({ roleStatus: 'pending' });
  console.log(`Found ${pendingRoles.length} pending role requests:`, pendingRoles.map(u => ({ name: u.name, email: u.email, role: u.role, requestedRole: u.requestedRole })));

  await mongoose.disconnect();
}

debugQueries().catch(console.error);
