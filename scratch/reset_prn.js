const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/src/models/User');

const resetPrn = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const student = await User.findOne({ email: 'mayur2006khandare@gmail.com' });
  if (student) {
    student.prn = '124BT10461';
    student.institutionalIdentifier = { identifierType: 'PRN', identifierValue: '124BT10461' };
    await student.save();
    console.log('Restored PRN to 124BT10461 for student:', student.name);
  }
  await mongoose.disconnect();
};

resetPrn();
