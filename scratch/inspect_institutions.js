const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking';

mongoose.connect(uri).then(async () => {
  const Institution = require('../server/src/models/Institution');
  const User = require('../server/src/models/User');

  const insts = await Institution.find({});
  console.log('=== INSTITUTIONS ===');
  insts.forEach(i => {
    console.log({
      id: i._id,
      name: i.name,
      institutionCode: i.institutionCode,
      tenantId: i.tenantId,
      code: i.code,
      shortName: i.shortName
    });
  });

  const admins = await User.find({
    role: { $in: ['admin', 'institution_admin', 'department_admin', 'super_admin', 'platform_owner'] }
  }).select('name email role institutionId tenantId adminId maviId');

  console.log('=== ADMINS ===');
  admins.forEach(a => {
    console.log({
      id: a._id,
      name: a.name,
      email: a.email,
      role: a.role,
      institutionId: a.institutionId,
      tenantId: a.tenantId,
      maviId: a.maviId
    });
  });

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
