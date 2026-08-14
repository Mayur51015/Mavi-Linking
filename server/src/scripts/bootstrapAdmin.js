const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Bootstrap Super Admin CLI Script
 *
 * Usage:
 *   node server/src/scripts/bootstrapAdmin.js admin@mavi.com SuperSecurePassword123! "Platform Super Admin"
 * Or via env variables:
 *   SUPER_ADMIN_EMAIL=admin@mavi.com SUPER_ADMIN_PASSWORD=... node server/src/scripts/bootstrapAdmin.js
 */
const bootstrapAdmin = async () => {
  const email = process.argv[2] || process.env.SUPER_ADMIN_EMAIL || 'admin@mavilinking.com';
  const password = process.argv[3] || process.env.SUPER_ADMIN_PASSWORD;
  const name = process.argv[4] || process.env.SUPER_ADMIN_NAME || 'Super Administrator';

  if (!email) {
    console.error('Error: Email is required to bootstrap a Super Admin account.');
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mavi-linking';
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(mongoUri);

  try {
    let user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (user) {
      console.log(`User found with email ${email}. Promoting to Super Admin...`);
      user.role = 'super_admin';
      if (!user.roles) user.roles = [];
      if (!user.roles.includes('super_admin')) user.roles.push('super_admin');
      if (!user.roles.includes('admin')) user.roles.push('admin');
      user.status = 'active';
      user.emailVerified = true;

      if (password) {
        user.password = password; // Will be hashed via pre-save
      }

      await user.save();
      console.log(`Successfully promoted ${user.email} (${user.name}) to Super Admin!`);
    } else {
      if (!password) {
        console.error('Error: Password is required to create a new Super Admin account.');
        process.exit(1);
      }

      console.log(`Creating new Super Admin account for ${email}...`);
      user = await User.create({
        name,
        email: email.toLowerCase().trim(),
        password,
        role: 'super_admin',
        roles: ['super_admin', 'admin', 'user'],
        status: 'active',
        emailVerified: true,
      });

      console.log(`Successfully created Super Admin account: ${user.email}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Bootstrapping error:', error.message);
    process.exit(1);
  }
};

bootstrapAdmin();
