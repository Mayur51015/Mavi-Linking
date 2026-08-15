const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/src/models/User');

const cleanupTeacherData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas for Teacher Data Cleanup...\n');

    // Delete test teacher accounts
    const result = await User.deleteMany({
      $or: [
        { role: 'teacher' },
        { roles: 'teacher' },
        { email: 'vijaydev172006@gmail.com' },
        { email: 'vaibhavi1826saudagar@gmail.com' },
        { name: /Vaibhavi Khandare/i },
      ],
    });

    console.log(`Deleted ${result.deletedCount} Teacher accounts.`);
    console.log('✨ Teacher table is now 100% clean and ready for fresh data!');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Cleanup Error:', err);
  }
};

cleanupTeacherData();
