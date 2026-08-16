require('dotenv').config({ path: 'server/.env' });
const mongoose = require('mongoose');
const User = require('../server/src/models/User');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mavi_linking';

async function checkEmails() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find({}, 'name email role maviId prn');
  console.log(`--- TOTAL USERS IN DATABASE: ${users.length} ---`);
  users.forEach((u) => {
    console.log(`- ${u.name} | Email: ${u.email} | Role: ${u.role} | MAVI ID: ${u.maviId}`);
  });
  await mongoose.disconnect();
}

checkEmails();
