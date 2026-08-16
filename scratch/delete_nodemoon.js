const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/src/models/User');
const AuditLog = require('../server/src/models/AuditLog');

async function deleteUserAccount() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking';
  await mongoose.connect(mongoUri);

  const email = 'nodemoon1718@gmail.com';
  const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

  if (!user) {
    console.log(`No account found with email: ${email}`);
    await mongoose.disconnect();
    return;
  }

  const userId = user._id;
  console.log(`Deleting user account: ${user.name} (${user.email}) [ID: ${userId}, MAVI ID: ${user.maviId}]`);

  const auditRes = await AuditLog.deleteMany({ $or: [{ actorId: userId }, { targetUserId: userId }] });
  console.log(`Deleted ${auditRes.deletedCount} related audit log entries.`);

  const userRes = await User.deleteOne({ _id: userId });
  console.log(`Deleted ${userRes.deletedCount} user record.`);

  console.log('Account successfully cleared from software database.');
  await mongoose.disconnect();
}

deleteUserAccount().catch(console.error);
