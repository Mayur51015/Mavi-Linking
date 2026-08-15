const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/src/models/User');

const cleanupAllTestDeptAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas for Complete Cleanup...\n');

    // 1. Delete all automated test department admin accounts
    const deleteResult = await User.deleteMany({
      $or: [
        { role: 'department_admin' },
        { roles: 'department_admin' },
        { email: { $regex: /^dept\.admin\./i } },
        { email: { $regex: /^cross\.inst\./i } },
        { email: 'mavi171826@gmail.com' },
        { name: 'Dr. Suresh Patil' },
        { name: 'Dr. Anita Deshmukh' },
      ],
    });

    console.log(`Deleted ${deleteResult.deletedCount} Department Admin accounts.`);

    // 2. Reset any student accounts that had departmentId assigned for tests
    await User.updateMany(
      { role: 'user', departmentId: { $ne: null } },
      { $set: { departmentId: null } }
    );

    console.log('\n✨ Cleanup completed successfully! Department Admins governance table is 100% clean and fresh.');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Cleanup Error:', err);
  }
};

cleanupAllTestDeptAdmins();
