const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');

async function seedSuperAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL || 'admin@mavilinking.com').toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD || 'AdminPass@123';
  const name = process.env.SEED_ADMIN_NAME || process.env.SUPER_ADMIN_NAME || 'Platform Super Admin';

  if (!email || !password) {
    console.error('❌ [SEED ERROR] Email and Password are required to seed Super Admin.');
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mavi_linking';

  try {
    await mongoose.connect(mongoUri);
    console.log(`✅ Connected to MongoDB database: ${mongoose.connection.name}`);

    let user = await User.findOne({ email }).select('+password');

    if (user) {
      console.log(`ℹ️ Existing account found for ${email}. Updating/Promoting to Platform Super Admin...`);
      user.name = name;
      user.role = 'super_admin';
      if (!user.roles) user.roles = [];
      if (!user.roles.includes('super_admin')) user.roles.push('super_admin');
      if (!user.roles.includes('admin')) user.roles.push('admin');
      if (!user.roles.includes('user')) user.roles.push('user');
      user.status = 'active';
      user.accountStatus = 'ACTIVE';
      user.isVerified = true;
      user.emailVerified = true;
      user.institutionId = null;
      user.departmentId = null;

      user.password = password;

      await user.save();
      console.log(`✅ Platform Super Admin account updated: ${email}`);
    } else {
      console.log(`👑 Creating new Platform Super Admin account for ${email}...`);

      user = await User.create({
        name,
        email,
        password: password,
        role: 'super_admin',
        roles: ['super_admin', 'admin', 'user'],
        status: 'active',
        accountStatus: 'ACTIVE',
        isVerified: true,
        emailVerified: true,
        institutionId: null,
        departmentId: null,
        maviId: 'MAVI-SUPER-ADMIN-01',
      });

      console.log(`✅ Platform Super Admin account created: ${email} [MAVI ID: ${user.maviId}]`);
    }

    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.error('❌ [SEED ERROR] Failed to seed Super Admin:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

if (require.main === module) {
  seedSuperAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedSuperAdmin;
