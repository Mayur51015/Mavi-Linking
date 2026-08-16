const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/src/models/User');

async function inspectUser() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking';
  console.log('Connecting to MongoDB:', mongoUri);
  await mongoose.connect(mongoUri);

  const email = 'nodemoon1718@gmail.com';
  const users = await User.find({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
  
  console.log(`Found ${users.length} user(s) matching ${email}:`);
  console.log(JSON.stringify(users, null, 2));

  await mongoose.disconnect();
}

inspectUser().catch(console.error);
