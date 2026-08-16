const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking';

mongoose.connect(uri).then(async () => {
  const Institution = require('../server/src/models/Institution');
  const User = require('../server/src/models/User');

  console.log('=== VERIFYING STUDENT REGISTRATION CODES ===');
  const insts = await Institution.find({});
  for (const inst of insts) {
    if (!inst.institutionCode || !inst.code) {
      inst.institutionCode = inst.institutionCode || inst.code || inst.tenantId;
      inst.code = inst.institutionCode;
      await inst.save();
      console.log(`Updated institution "${inst.name}" -> Code: ${inst.institutionCode}`);
    } else {
      console.log(`Institution "${inst.name}" -> Code: ${inst.institutionCode} | Tenant: ${inst.tenantId}`);
    }
  }

  const admin = await User.findOne({ email: 'vijaydev172006@gmail.com' }).populate('institutionId');
  if (admin && admin.institutionId) {
    console.log(`Admin "${admin.name}" (${admin.email}) assigned to Institution:`);
    console.log(`- Institution Name: ${admin.institutionId.name}`);
    console.log(`- Student Registration Code (institutionCode): ${admin.institutionId.institutionCode}`);
    console.log(`- Tenant ID: ${admin.institutionId.tenantId}`);
  } else {
    console.log('Admin not found or no institutionId assigned.');
  }

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
