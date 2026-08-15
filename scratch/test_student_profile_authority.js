const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const User = require('../server/src/models/User');
const Institution = require('../server/src/models/Institution');
const AuditLog = require('../server/src/models/AuditLog');

const runTest = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);

    console.log('--- 1. FETCH TEST USERS ---');
    const owner = await User.findOne({ role: { $in: ['platform_owner', 'super_admin'] } });
    const instAdmin = await User.findOne({ email: 'admin.zcoer@mavilinking.com' });
    const student = await User.findOne({ email: 'mayur2006khandare@gmail.com' });

    console.log('Owner:', owner?.name, owner?.email);
    console.log('InstAdmin:', instAdmin?.name, instAdmin?.email, 'InstitutionId:', instAdmin?.institutionId);
    console.log('Student:', student?.name, student?.email, 'PRN:', student?.prn, 'MAVI ID:', student?.maviId);

    if (!student) {
      console.error('Student not found!');
      process.exit(1);
    }

    console.log('\n--- 2. VERIFY AUDIT LOG SCHEMA ---');
    const recentLogs = await AuditLog.find({ targetUserId: student._id }).sort({ createdAt: -1 });
    console.log(`Found ${recentLogs.length} audit logs for student.`);

    console.log('\n--- 3. VERIFY PRN HISTORY ON STUDENT ---');
    console.log('PRN History count:', student.prnHistory ? student.prnHistory.length : 0);

    console.log('\n✅ Database models and schemas ready for API execution!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error during test execution:', err);
    process.exit(1);
  }
};

runTest();
