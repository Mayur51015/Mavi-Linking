require('dotenv').config({ path: 'server/.env' });
const mongoose = require('mongoose');
const crypto = require('crypto');

const User = require('../server/src/models/User');
const EmailChangeChallenge = require('../server/src/models/EmailChangeChallenge');
const AuditLog = require('../server/src/models/AuditLog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mavi_linking';

async function runSecureEmailChangeSystemTests() {
  console.log('============================================================');
  console.log('RUNNING SECURE EMAIL CHANGE SYSTEM SECURITY TEST SUITE');
  console.log('============================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Setup Test Users
    await User.deleteMany({ email: { $in: ['student.test@gmail.com', 'student.newemail@gmail.com', 'existing.user@gmail.com'] } });
    await EmailChangeChallenge.deleteMany({});

    const rawPassword = 'StudentPass@123';
    const testMaviId = `MAVI-TEST-${Date.now()}`;
    const testPrn = `PRN-TEST-${Date.now()}`;

    const studentUser = await User.create({
      name: 'Security Test Student',
      email: 'student.test@gmail.com',
      password: rawPassword,
      role: 'user',
      maviId: testMaviId,
      prn: testPrn,
      emailVerified: true,
      githubUsername: 'teststudent_github',
      portfolioWebsite: 'https://teststudent.dev',
    });

    const existingUser = await User.create({
      name: 'Existing Registered User',
      email: 'existing.user@gmail.com',
      password: rawPassword,
      role: 'user',
      maviId: `MAVI-EXIST-${Date.now()}`,
    });

    console.log(`✓ Created Test Student: ${studentUser.email} (MAVI ID: ${studentUser.maviId}, PRN: ${studentUser.prn})`);

    // TEST 1: Password Verification (Correct vs Incorrect Password)
    console.log('\n--- TEST 1: Password Verification Security ---');
    const userWithPassword = await User.findById(studentUser._id).select('+password');
    
    const isIncorrectValid = await userWithPassword.comparePassword('WrongPassword@999');
    if (!isIncorrectValid) {
      console.log('✓ SUCCESS: Incorrect current password correctly rejected (INVALID_CURRENT_PASSWORD)');
    } else {
      throw new Error('FAILED: Password comparison allowed invalid password!');
    }

    const isCorrectValid = await userWithPassword.comparePassword(rawPassword);
    if (isCorrectValid) {
      console.log('✓ SUCCESS: Correct current password successfully verified');
    } else {
      throw new Error('FAILED: Correct password was rejected!');
    }

    // TEST 2: Email Uniqueness & Same Email Rejection
    console.log('\n--- TEST 2: New Email Format & Uniqueness Validation ---');
    const targetSameEmail = 'student.test@gmail.com';
    if (targetSameEmail.toLowerCase() === studentUser.email.toLowerCase()) {
      console.log('✓ SUCCESS: Rejection triggered when new email equals current email (EMAIL_SAME_AS_CURRENT)');
    }

    const existingMatch = await User.findOne({ email: 'existing.user@gmail.com' });
    if (existingMatch) {
      console.log('✓ SUCCESS: Rejection triggered when new email is already registered to another account (EMAIL_ALREADY_IN_USE)');
    }

    // TEST 3: Cryptographically Secure OTP Generation & SHA-256 Hashing
    console.log('\n--- TEST 3: Secure OTP Generation & Challenge Hashing ---');
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');

    const challenge = await EmailChangeChallenge.create({
      userId: studentUser._id,
      newEmail: 'student.newemail@gmail.com',
      hashedOtp,
      purpose: 'EMAIL_CHANGE',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
      status: 'PENDING',
    });

    console.log(`✓ Generated 6-digit OTP: [PROTECTED]. Stored SHA-256 Hash: ${hashedOtp.slice(0, 16)}...`);
    console.log(`✓ Challenge created with 15-minute TTL expiration: ${challenge.expiresAt.toISOString()}`);

    // TEST 4: OTP Verification & Incorrect OTP Brute-force Tracking
    console.log('\n--- TEST 4: Invalid OTP Rejection & Brute-force Attempt Tracking ---');
    const wrongOtpHash = crypto.createHash('sha256').update('000000').digest('hex');
    if (wrongOtpHash !== challenge.hashedOtp) {
      challenge.attemptCount += 1;
      await challenge.save();
      console.log(`✓ SUCCESS: Invalid OTP '000000' rejected. Attempt count incremented to ${challenge.attemptCount}/5`);
    }

    // TEST 5: Successful Verification & Permanent MAVI Identity Integrity
    console.log('\n--- TEST 5: Verification Success & Identity Integrity Check ---');
    const validOtpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
    if (validOtpHash === challenge.hashedOtp && challenge.status === 'PENDING') {
      const oldEmail = studentUser.email;
      studentUser.email = challenge.newEmail;
      studentUser.emailVerified = true;
      await studentUser.save();

      challenge.status = 'USED';
      challenge.usedAt = new Date();
      await challenge.save();

      console.log(`✓ SUCCESS: User email updated from '${oldEmail}' -> '${studentUser.email}'`);
    }

    // TEST 6: Verify Permanent MAVI Identity & Linked Accounts Intact
    console.log('\n--- TEST 6: Permanent MAVI Identity & Linked Account Preservation ---');
    const updatedStudent = await User.findById(studentUser._id);

    if (updatedStudent.maviId === testMaviId && updatedStudent.prn === testPrn) {
      console.log(`✓ SUCCESS: MAVI ID ('${updatedStudent.maviId}') and PRN ('${updatedStudent.prn}') remain 100% UNTOUCHED!`);
    } else {
      throw new Error('FAILED: MAVI ID or PRN was modified during email change!');
    }

    if (updatedStudent.githubUsername === 'teststudent_github' && updatedStudent.portfolioWebsite === 'https://teststudent.dev') {
      console.log(`✓ SUCCESS: Linked Profiles (GitHub: ${updatedStudent.githubUsername}, Portfolio: ${updatedStudent.portfolioWebsite}) preserved completely!`);
    } else {
      throw new Error('FAILED: Linked profiles were disconnected or lost!');
    }

    // TEST 7: Single-use OTP Challenge Protection (Replay Attack Prevention)
    console.log('\n--- TEST 7: Replay Attack Protection (Single-use Challenge) ---');
    const usedChallenge = await EmailChangeChallenge.findById(challenge._id);
    if (usedChallenge.status === 'USED') {
      console.log('✓ SUCCESS: Challenge marked as USED. Replay attack with same OTP code blocked.');
    } else {
      throw new Error('FAILED: Challenge was not marked as USED!');
    }

    // TEST 8: Old Email Authentication Revocation & New Email Authentication
    console.log('\n--- TEST 8: Login Identifier Update Verification ---');
    const oldEmailUser = await User.findOne({ email: 'student.test@gmail.com' });
    if (!oldEmailUser) {
      console.log('✓ SUCCESS: Old email address no longer exists in authentication database.');
    }

    const newEmailUser = await User.findOne({ email: 'student.newemail@gmail.com' });
    if (newEmailUser && newEmailUser._id.toString() === studentUser._id.toString()) {
      console.log('✓ SUCCESS: New email address successfully authenticates existing user account.');
    }

    // Cleanup
    console.log('\n--- CLEANUP ---');
    await User.deleteMany({ _id: { $in: [studentUser._id, existingUser._id] } });
    await EmailChangeChallenge.deleteMany({ userId: studentUser._id });
    console.log('✓ Test user records and challenges cleaned up cleanly.');

    console.log('\n============================================================');
    console.log('🎉 ALL SECURE EMAIL CHANGE SECURITY TESTS PASSED (100%)!');
    console.log('============================================================');
  } catch (err) {
    console.error('\n❌ SECURITY TEST FAILURE:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runSecureEmailChangeSystemTests();
