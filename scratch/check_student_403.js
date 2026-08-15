const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/src/models/User');

const check = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const student = await User.findById('6a7ed8b0e0cb2d88b4a03512');
  console.log('Student 6a7ed8b0e0cb2d88b4a03512:');
  if (student) {
    console.log('  Name:', student.name);
    console.log('  Email:', student.email);
    console.log('  Role:', student.role);
    console.log('  InstitutionId:', student.institutionId);
    console.log('  TenantId:', student.tenantId);
    console.log('  University:', student.university);
  } else {
    console.log('  NOT FOUND in DB by ID 6a7ed8b0e0cb2d88b4a03512');
  }

  console.log('\nAll Institution Admins in DB:');
  const admins = await User.find({ role: { $in: ['institution_admin', 'admin', 'super_admin'] } });
  admins.forEach(a => {
    console.log(`  Admin: ${a.name} (${a.email}) | Role: ${a.role} | InstitutionId: ${a.institutionId} | TenantId: ${a.tenantId} | Permissions: ${JSON.stringify(a.permissions)}`);
  });

  console.log('\nAll Students in DB:');
  const students = await User.find({ role: 'user' });
  students.forEach(s => {
    console.log(`  Student: ${s.name} (${s._id}) | Email: ${s.email} | InstitutionId: ${s.institutionId} | TenantId: ${s.tenantId}`);
  });

  await mongoose.disconnect();
};

check();
