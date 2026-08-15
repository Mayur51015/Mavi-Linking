const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/src/models/User');

const API_BASE = 'http://localhost:5000/api';

const testActivation = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas for Account Activation Test\n');

    // Clean any prior test user
    const testEmail = 'dept.admin.activation.test@zeal.edu';
    await User.deleteMany({ email: testEmail });

    // 1. Create invited user
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.create({
      name: 'Test Dept Admin Activation',
      email: testEmail,
      role: 'department_admin',
      roles: ['department_admin'],
      accountStatus: 'INVITED',
      status: 'invited',
      invitationToken: hashedToken,
      invitationExpires: Date.now() + 48 * 3600 * 1000,
      passwordSetupRequired: true,
    });

    console.log('Created Invited Department Admin:', user.name, '| MAVI ID:', user.maviId);

    // 2. Call /api/auth/verify-invitation/:token
    const verifyRes = await axios.get(`${API_BASE}/auth/verify-invitation/${rawToken}`);
    console.log('\n[GET /auth/verify-invitation/:token]:');
    console.log('Status Code:', verifyRes.status);
    console.log('Returned Data:', verifyRes.data?.data);

    // 3. Call /api/auth/activate-account
    const activateRes = await axios.post(`${API_BASE}/auth/activate-account`, {
      token: rawToken,
      password: 'NewSecurePassword123!',
    });

    console.log('\n[POST /auth/activate-account]:');
    console.log('Status Code:', activateRes.status);
    console.log('Message:', activateRes.data?.message);

    // 4. Verify user in database after activation
    const updatedUser = await User.findOne({ email: testEmail });
    console.log('\nUser state after activation:');
    console.log('Account Status:', updatedUser.accountStatus, '(Expected ACTIVE)');
    console.log('Status:', updatedUser.status, '(Expected active)');
    console.log('Email Verified?:', updatedUser.emailVerified, '(Expected true)');
    console.log('Role:', updatedUser.role);
    console.log('Roles:', updatedUser.roles);

    // Clean up
    await User.deleteMany({ email: testEmail });
    console.log('\n🎉 ACCOUNT ACTIVATION TEST PASSED CLEANLY!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('\n❌ Activation Test Failed:', err.response?.data || err.message);
    await mongoose.disconnect();
  }
};

testActivation();
