const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking';

async function clearDemoData() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB:', mongoUri);

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  const Institution = mongoose.model('Institution', new mongoose.Schema({}, { strict: false }), 'institutions');
  const Department = mongoose.model('Department', new mongoose.Schema({}, { strict: false }), 'departments');
  const AuditLog = mongoose.model('AuditLog', new mongoose.Schema({}, { strict: false }), 'auditlogs');
  const ActivityLog = mongoose.model('ActivityLog', new mongoose.Schema({}, { strict: false }), 'activitylogs');
  const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }), 'notifications');
  const InstitutionMembership = mongoose.model('InstitutionMembership', new mongoose.Schema({}, { strict: false }), 'institutionmemberships');

  const demoEmails = [
    'admin.demo@mavilinking.com',
    'cse.admin.demo@mavilinking.com',
    'it.admin.demo@mavilinking.com',
    'entc.admin.demo@mavilinking.com',
    'mech.admin.demo@mavilinking.com',
    'civil.admin.demo@mavilinking.com',
    'student.cse01@demo.mavilinking.com',
    'student.cse02@demo.mavilinking.com',
    'student.it01@demo.mavilinking.com',
    'student.it02@demo.mavilinking.com',
    'student.entc01@demo.mavilinking.com',
    'student.entc02@demo.mavilinking.com',
    'student.mech01@demo.mavilinking.com',
    'student.mech02@demo.mavilinking.com',
    'student.civil01@demo.mavilinking.com',
    'student.civil02@demo.mavilinking.com',
    'teacher.cse01@demo.mavilinking.com',
    'teacher.it01@demo.mavilinking.com',
    'recruiter.demo01@mavilinking.com',
    'recruiter.demo02@mavilinking.com',
  ];

  // Find user IDs to purge
  const usersToPurge = await User.find({
    $or: [
      { email: { $in: demoEmails } },
      { tenantId: 'MAVI-DEMO-001' },
      { email: /@demo\.mavilinking\.com$/ }
    ]
  });

  const purgeIds = usersToPurge.map(u => u._id);
  console.log(`Found ${usersToPurge.length} demo accounts to purge.`);

  // Delete demo users
  const userDel = await User.deleteMany({ _id: { $in: purgeIds } });
  console.log(`Deleted ${userDel.deletedCount} demo user accounts.`);

  // Delete MAVI Demo Institution
  const instDel = await Institution.deleteMany({
    $or: [
      { institutionCode: 'MAVI-DEMO-001' },
      { tenantId: 'MAVI-DEMO-001' },
      { code: 'MAVI-DEMO-001' },
      { name: 'MAVI Demo Institution' }
    ]
  });
  console.log(`Deleted ${instDel.deletedCount} demo institution(s).`);

  // Delete demo departments
  const deptDel = await Department.deleteMany({
    $or: [
      { code: { $in: ['CSE', 'IT', 'ENTC', 'MECH', 'CIVIL'] } },
      { name: { $in: ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Civil Engineering'] } }
    ]
  });
  console.log(`Deleted ${deptDel.deletedCount} demo department(s).`);

  // Clear logs associated with purged users
  await AuditLog.deleteMany({ targetUserId: { $in: purgeIds } });
  await ActivityLog.deleteMany({ userId: { $in: purgeIds } });
  await Notification.deleteMany({ recipient: { $in: purgeIds } });
  await InstitutionMembership.deleteMany({ userId: { $in: purgeIds } });

  // Print remaining database inventory
  const remainingUsers = await User.find({});
  const remainingInsts = await Institution.find({});
  const remainingDepts = await Department.find({});

  console.log('\n=== REMAINING DATABASE INVENTORY ===');
  console.log(`Institutions: ${remainingInsts.length}`);
  console.log(`Departments: ${remainingDepts.length}`);
  console.log(`Users (${remainingUsers.length}):`);
  remainingUsers.forEach(u => {
    console.log(` - ${u.name} (${u.email}) [Role: ${u.role}]`);
  });

  await mongoose.disconnect();
  console.log('\n✅ Demo data cleanup complete!');
}

clearDemoData().catch(err => {
  console.error(err);
  process.exit(1);
});
