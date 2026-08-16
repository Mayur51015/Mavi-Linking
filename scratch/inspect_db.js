const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking';

async function inspect() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB:', mongoUri);

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  const Institution = mongoose.model('Institution', new mongoose.Schema({}, { strict: false }), 'institutions');
  const Department = mongoose.model('Department', new mongoose.Schema({}, { strict: false }), 'departments');
  const AuditLog = mongoose.model('AuditLog', new mongoose.Schema({}, { strict: false }), 'auditlogs');
  const ActivityLog = mongoose.model('ActivityLog', new mongoose.Schema({}, { strict: false }), 'activitylogs');
  const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }), 'notifications');
  const InstitutionMembership = mongoose.model('InstitutionMembership', new mongoose.Schema({}, { strict: false }), 'institutionmemberships');

  const institutions = await Institution.find({});
  console.log('\n=== INSTITUTIONS (' + institutions.length + ') ===');
  institutions.forEach(inst => {
    console.log(`- ID: ${inst._id} | Name: "${inst.name}" | Code: "${inst.institutionCode || inst.code}" | Status: ${inst.status}`);
  });

  const departments = await Department.find({});
  console.log('\n=== DEPARTMENTS (' + departments.length + ') ===');
  departments.forEach(dept => {
    console.log(`- ID: ${dept._id} | InstID: ${dept.institutionId} | Name: "${dept.name}" | Code: "${dept.code}"`);
  });

  const users = await User.find({});
  console.log('\n=== USERS (' + users.length + ') ===');
  users.forEach(u => {
    console.log(`- ID: ${u._id} | Name: "${u.name}" | Email: "${u.email}" | Role: "${u.role}" | Roles: [${u.roles ? u.roles.join(',') : ''}] | AccountStatus: "${u.accountStatus}" | InstID: ${u.institutionId} | DeptID: ${u.departmentId} | MAVI: ${u.maviId} | PRN: ${u.prn}`);
  });

  console.log('\n=== TENANT SCOPED LOGS & COLLECTIONS ===');
  console.log('AuditLog count:', await AuditLog.countDocuments({}));
  console.log('ActivityLog count:', await ActivityLog.countDocuments({}));
  console.log('Notification count:', await Notification.countDocuments({}));
  console.log('InstitutionMembership count:', await InstitutionMembership.countDocuments({}));

  await mongoose.disconnect();
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
