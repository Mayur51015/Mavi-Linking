const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking';

mongoose.connect(uri).then(async () => {
  const User = require('../server/src/models/User');
  const AuditLog = require('../server/src/models/AuditLog');
  const ActivityLog = require('../server/src/models/ActivityLog');
  const InstitutionMembership = require('../server/src/models/InstitutionMembership');

  const targetEmail = 'mayur2006khandare@gmail.com';
  console.log(`Searching for account with email: "${targetEmail}"...`);

  const user = await User.findOne({ email: new RegExp(`^${targetEmail.replace('.', '\\.')}$`, 'i') });

  if (!user) {
    console.log(`No user account found matching "${targetEmail}". Database is already clean.`);
    process.exit(0);
  }

  console.log('Found user account:');
  console.log({
    id: user._id,
    name: user.name,
    email: user.email,
    maviId: user.maviId,
    role: user.role,
    roles: user.roles,
    createdAt: user.createdAt,
  });

  const userId = user._id;

  // Delete related records
  const auditRes = await AuditLog.deleteMany({ $or: [{ targetUserId: userId }, { actorId: userId }] });
  console.log(`Deleted ${auditRes.deletedCount} AuditLog records.`);

  const actRes = await ActivityLog.deleteMany({ userId: userId });
  console.log(`Deleted ${actRes.deletedCount} ActivityLog records.`);

  const memRes = await InstitutionMembership.deleteMany({ userId: userId });
  console.log(`Deleted ${memRes.deletedCount} InstitutionMembership records.`);

  // Try cleaning additional models if present
  try {
    const Portfolio = mongoose.model('Portfolio');
    const portRes = await Portfolio.deleteMany({ userId: userId });
    console.log(`Deleted ${portRes.deletedCount} Portfolio records.`);
  } catch (_) {}

  try {
    const Application = mongoose.model('Application');
    const appRes = await Application.deleteMany({ studentId: userId });
    console.log(`Deleted ${appRes.deletedCount} Job Application records.`);
  } catch (_) {}

  // Delete user account
  await User.deleteOne({ _id: userId });
  console.log(`✅ Successfully deleted user account "${user.email}" (${user.maviId}) from the software!`);

  // Verify deletion
  const check = await User.findOne({ email: new RegExp(`^${targetEmail.replace('.', '\\.')}$`, 'i') });
  if (!check) {
    console.log('VERIFICATION PASSED: No user record for this email exists in MongoDB.');
  } else {
    console.error('VERIFICATION FAILED: User record still present!');
  }

  process.exit(0);
}).catch(err => {
  console.error('Error during deletion:', err);
  process.exit(1);
});
