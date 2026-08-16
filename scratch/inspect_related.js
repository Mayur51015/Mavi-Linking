const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const AuditLog = require('../server/src/models/AuditLog');
const User = require('../server/src/models/User');

async function inspectRelated() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking';
  await mongoose.connect(mongoUri);

  const email = 'nodemoon1718@gmail.com';
  const user = await User.findOne({ email });

  if (user) {
    const logs = await AuditLog.find({ $or: [{ actorId: user._id }, { targetUserId: user._id }] });
    console.log(`User ID: ${user._id}`);
    console.log(`Related AuditLogs: ${logs.length}`);
  } else {
    console.log('User not found.');
  }

  await mongoose.disconnect();
}

inspectRelated().catch(console.error);
