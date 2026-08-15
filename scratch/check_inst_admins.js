const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/src/models/User');
const Institution = require('../server/src/models/Institution');
const Department = require('../server/src/models/Department');

const checkAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const admins = await User.find({
      $or: [
        { role: { $in: ['platform_owner', 'owner', 'super_admin', 'institution_admin', 'department_admin', 'admin'] } },
        { roles: { $in: ['platform_owner', 'owner', 'super_admin', 'institution_admin', 'department_admin', 'admin'] } },
      ],
    }).populate('institutionId', 'name code tenantId').populate('departmentId', 'name code');

    console.log('--- INSTITUTION ADMINS IN SYSTEM ---');
    admins.forEach((a) => {
      console.log(`Name: ${a.name}`);
      console.log(`Email: ${a.email}`);
      console.log(`MAVI ID: ${a.maviId}`);
      console.log(`Primary Role: ${a.role}`);
      console.log(`Roles Array: ${JSON.stringify(a.roles)}`);
      console.log(`Institution: ${a.institutionId ? a.institutionId.name : 'Unassigned'} (${a.tenantId || a.institutionId?.tenantId || 'N/A'})`);
      console.log('-----------------------------------');
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

checkAdmins();
