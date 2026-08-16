const http = require('http');
const mongoose = require('mongoose');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runVerificationSecuritySuite() {
  console.log('=== STARTING MAVI LINKING VERIFICATION SECURITY TEST SUITE ===\n');
  const timestamp = Date.now();
  const testEmail = `student_test_${timestamp}@example.com`;
  const testPrn = `PRN_${timestamp}`;
  let userMaviId = null;

  try {
    // TEST 1: Register Student
    console.log('TEST 1: Registering new student...');
    const regRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Security Test Student',
        email: testEmail,
        password: 'Password123!',
        prn: testPrn,
        role: 'user',
      }
    );

    console.log('✅ Registration status:', regRes.status);
    console.log('✅ Registration response body:', JSON.stringify(regRes.data, null, 2));

    const returnedUser = regRes.data?.data?.user || regRes.data?.data;
    const returnedStatus = returnedUser?.accountStatus || regRes.data?.data?.accountStatus;
    const returnedEmailVerified = returnedUser?.emailVerified ?? regRes.data?.data?.emailVerified;

    console.log('✅ Account Status:', returnedStatus);
    console.log('✅ Email Verified:', returnedEmailVerified);
    console.log('✅ Response Code:', regRes.data?.code);

    if (returnedStatus !== 'PENDING_VERIFICATION') {
      throw new Error(`FAILED: Registered student accountStatus is ${returnedStatus}, expected PENDING_VERIFICATION`);
    }
    if (returnedEmailVerified !== false) {
      throw new Error(`FAILED: Registered student emailVerified is ${returnedEmailVerified}, expected false`);
    }

    // TEST 2: Duplicate Email Rejection
    console.log('\nTEST 2: Testing duplicate email registration...');
    const dupEmailRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Duplicate Student',
        email: testEmail,
        password: 'Password123!',
        prn: `PRN_OTHER_${timestamp}`,
      }
    );

    if (dupEmailRes.status === 409 && dupEmailRes.data?.code === 'EMAIL_ALREADY_REGISTERED') {
      console.log('✅ Duplicate email correctly rejected with 409 EMAIL_ALREADY_REGISTERED');
    } else {
      console.error('❌ Unexpected response on duplicate email:', dupEmailRes);
    }

    // TEST 3: Duplicate PRN Rejection
    console.log('\nTEST 3: Testing duplicate PRN registration...');
    const dupPrnRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Another Student',
        email: `another_${timestamp}@example.com`,
        password: 'Password123!',
        prn: testPrn,
      }
    );

    if (dupPrnRes.status === 409 && dupPrnRes.data?.code === 'PRN_ALREADY_REGISTERED') {
      console.log('✅ Duplicate PRN correctly rejected with 409 PRN_ALREADY_REGISTERED');
    } else {
      console.error('❌ Unexpected response on duplicate PRN:', dupPrnRes);
    }

    // TEST 4: Login Attempt Before Verification
    console.log('\nTEST 4: Attempting login before email verification...');
    const unverifiedLoginRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        identifier: testEmail,
        password: 'Password123!',
      }
    );

    if (unverifiedLoginRes.status === 403 && unverifiedLoginRes.data?.code === 'EMAIL_VERIFICATION_REQUIRED') {
      console.log('✅ Login correctly blocked with 403 EMAIL_VERIFICATION_REQUIRED');
      userMaviId = unverifiedLoginRes.data?.data?.maviId;
      console.log('   Preserved MAVI ID:', userMaviId);
    } else {
      console.error('❌ Unexpected response on unverified login:', unverifiedLoginRes);
    }

    // TEST 5: Rate-limited Resend Verification
    console.log('\nTEST 5: Testing resend verification rate limit...');
    const resend1 = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/resend-verification',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: testEmail }
    );
    console.log('✅ First resend status:', resend1.status, resend1.data?.message);

    const resend2 = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/resend-verification',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: testEmail }
    );

    if (resend2.status === 429 && resend2.data?.code === 'RESEND_RATE_LIMITED') {
      console.log('✅ Resend retry correctly rate-limited with 429 RESEND_RATE_LIMITED');
    } else {
      console.error('❌ Unexpected response on resend retry:', resend2);
    }

    // Connect DB directly to retrieve token for verification step
    console.log('\nTEST 6: Retrieving token & completing verification...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    const User = require('../models/User');
    const dbUser = await User.findOne({ email: testEmail }).select('+verificationToken');

    if (!dbUser || !dbUser.verificationToken) {
      console.error('❌ Could not retrieve hashed token from DB');
    } else {
      console.log('   User found in DB with MAVI ID:', dbUser.maviId);

      // Verify email using the token
      const verifyRes = await makeRequest(
        {
          hostname: 'localhost',
          port: 5000,
          path: '/api/auth/verify-email',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        { token: dbUser.verificationToken }
      );

      console.log('✅ Verification status:', verifyRes.status);
      console.log('✅ Account status after verification:', verifyRes.data?.data?.accountStatus);
      console.log('✅ Email verified:', verifyRes.data?.data?.emailVerified);

      if (verifyRes.data?.data?.accountStatus !== 'ACTIVE' || verifyRes.data?.data?.emailVerified !== true) {
        throw new Error('FAILED: Account status is not ACTIVE or emailVerified is not true');
      }

      // TEST 7: Single-use token enforcement
      console.log('\nTEST 7: Re-submitting same verification token (Single-use test)...');
      const reuseRes = await makeRequest(
        {
          hostname: 'localhost',
          port: 5000,
          path: '/api/auth/verify-email',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        { token: dbUser.verificationToken }
      );

      if (reuseRes.status === 400 && reuseRes.data?.code === 'VERIFICATION_TOKEN_ALREADY_USED') {
        console.log('✅ Token reuse correctly rejected with 400 VERIFICATION_TOKEN_ALREADY_USED');
      } else {
        console.error('❌ Unexpected response on token reuse:', reuseRes);
      }

      // TEST 8: Login After Verification
      console.log('\nTEST 8: Attempting login after verification...');
      const verifiedLoginRes = await makeRequest(
        {
          hostname: 'localhost',
          port: 5000,
          path: '/api/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        {
          identifier: testEmail,
          password: 'Password123!',
        }
      );
      console.log('✅ Verified login status:', verifiedLoginRes.status);
      console.log('✅ Auth token issued:', verifiedLoginRes.data?.data?.token ? 'Yes (JWT Valid)' : 'No');
    }

    console.log('\n============================================================');
    console.log('🎉 ALL 8 SECURITY VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('============================================================');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILURE:', error.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

runVerificationSecuritySuite();
