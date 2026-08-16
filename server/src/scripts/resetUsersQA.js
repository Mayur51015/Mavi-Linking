const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * 🔒 SAFETY GUARDS & ENVIRONMENT VALIDATION
 */
if (process.env.NODE_ENV === 'production') {
  console.error('\n❌ USER DATABASE RESET IS DISABLED IN PRODUCTION.\n');
  process.exit(1);
}

if (process.env.ALLOW_DB_RESET !== 'true') {
  console.error('\n❌ USER DATABASE RESET ABORTED: ALLOW_DB_RESET=true environment variable is required.\n');
  process.exit(1);
}

if (process.env.CONFIRM_DB_RESET !== 'true') {
  console.error('\n❌ Database reset not executed. Explicit confirmation required.\n');
  process.exit(1);
}

// Models
const User = require('../models/User');
const Institution = require('../models/Institution');
const Department = require('../models/Department');
const Role = require('../models/Role');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const InstitutionMembership = require('../models/InstitutionMembership');
const Verification = require('../models/Verification');
const EmailChangeChallenge = require('../models/EmailChangeChallenge');
const Activity = require('../models/Activity');
const ActivityLog = require('../models/ActivityLog');
const RecruitmentNotification = require('../models/RecruitmentNotification');
const RecruiterBookmark = require('../models/RecruiterBookmark');
const RecruitmentPipeline = require('../models/RecruitmentPipeline');
const Job = require('../models/Job');
const PlacementDrive = require('../models/PlacementDrive');
const TeacherAnnouncement = require('../models/TeacherAnnouncement');
const Message = require('../models/Message');
const Project = require('../models/Project');
const Ranking = require('../models/Ranking');
const Report = require('../models/Report');
const SharedDocument = require('../models/SharedDocument');
const TimelineEvent = require('../models/TimelineEvent');
const Badge = require('../models/Badge');
const CareerBadge = require('../models/CareerBadge');
const Analytics = require('../models/Analytics');
const LeetCodeAnalytics = require('../models/LeetCodeAnalytics');
const CareerAnalytics = require('../models/CareerAnalytics');
const CareerInsight = require('../models/CareerInsight');
const CareerScore = require('../models/CareerScore');
const CareerSkillAnalysis = require('../models/CareerSkillAnalysis');
const CareerTimeline = require('../models/CareerTimeline');
const Compatibility = require('../models/Compatibility');
const DNA = require('../models/DNA');
const Insight = require('../models/Insight');
const Company = require('../models/Company');
const AuditLog = require('../models/AuditLog');
const WebhookLog = require('../models/WebhookLog');

const seedSuperAdminScript = require('./seedSuperAdmin');

async function resetUsersQA() {
  console.log('============================================================');
  console.log('MAVI LINKING — SAFE QA MANUAL TEST ENVIRONMENT RESET');
  console.log('============================================================\n');

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mavi_linking';
  
  await mongoose.connect(mongoUri);
  console.log(`✅ Connected to MongoDB database: ${mongoose.connection.name}`);

  // ─── 1. INSPECT EXISTING DATABASE & IDENTIFY USERS ─────────────────────────
  const allUsers = await User.find({}).select('+refreshToken +resetPasswordToken +resetPasswordOtp +verificationToken +invitationToken');
  
  const seedSuperAdminEmail = (process.env.SEED_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL || 'admin@mavilinking.com').toLowerCase().trim();

  const preservedUserIds = [];
  const usersToPurgeIds = [];
  let preservedSuperAdminCount = 0;
  let studentsCountToPurge = 0;
  let teachersCountToPurge = 0;
  let recruitersCountToPurge = 0;
  let instAdminsCountToPurge = 0;
  let deptAdminsCountToPurge = 0;

  for (const u of allUsers) {
    const isSuperAdminRole =
      u.role === 'super_admin' ||
      u.role === 'platform_owner' ||
      (Array.isArray(u.roles) && (u.roles.includes('super_admin') || u.roles.includes('platform_owner')));

    const isSeedEmailMatch = u.email.toLowerCase().trim() === seedSuperAdminEmail;

    // Platform Super Admin must NOT be linked to a tenant institution
    if ((isSuperAdminRole || isSeedEmailMatch) && !u.institutionId) {
      preservedUserIds.push(u._id);
      preservedSuperAdminCount++;
    } else {
      usersToPurgeIds.push(u._id);
      if (u.role === 'user' || (Array.isArray(u.roles) && u.roles.includes('student'))) studentsCountToPurge++;
      else if (u.role === 'teacher') teachersCountToPurge++;
      else if (u.role === 'recruiter') recruitersCountToPurge++;
      else if (u.role === 'institution_admin') instAdminsCountToPurge++;
      else if (u.role === 'department_admin') deptAdminsCountToPurge++;
    }
  }

  // Count preserved setup
  const instCount = await Institution.countDocuments({});
  const deptCount = await Department.countDocuments({});
  const roleCount = await Role.countDocuments({});
  const planCount = await Plan.countDocuments({});
  const subCount = await Subscription.countDocuments({});
  const payCount = await Payment.countDocuments({});

  // Count transient tokens & auth records to remove
  const verificationsCount = await Verification.countDocuments({ userId: { $in: usersToPurgeIds } });
  const emailChallengesCount = await EmailChangeChallenge.countDocuments({});
  const membershipsCount = await InstitutionMembership.countDocuments({ userId: { $in: usersToPurgeIds } });
  const notifsCount = await RecruitmentNotification.countDocuments({ recipient: { $in: usersToPurgeIds } });
  const userAuditLogsCount = await AuditLog.countDocuments({
    $or: [{ actorId: { $in: usersToPurgeIds } }, { targetUserId: { $in: usersToPurgeIds } }],
  });

  // ─── 2. PRE-RESET SAFE SUMMARY DISPLAY ─────────────────────────────────────
  console.log('\n📊 PRE-RESET INSPECTION SUMMARY:');
  console.log('────────────────────────────────────────────────────────────');
  console.log(`  Users to remove:              ${usersToPurgeIds.length}`);
  console.log(`    └─ Students:               ${studentsCountToPurge}`);
  console.log(`    └─ Teachers:               ${teachersCountToPurge}`);
  console.log(`    └─ Recruiters:             ${recruitersCountToPurge}`);
  console.log(`    └─ Institution Admins:     ${instAdminsCountToPurge}`);
  console.log(`    └─ Department Admins:      ${deptAdminsCountToPurge}`);
  console.log(`  Sessions & Refresh Tokens:   CLEARED (${usersToPurgeIds.length} users)`);
  console.log(`  Verification records to clear: ${verificationsCount}`);
  console.log(`  Email challenge records:     ${emailChallengesCount}`);
  console.log(`  Institution memberships:     ${membershipsCount}`);
  console.log(`  User notifications to clear: ${notifsCount}`);
  console.log(`  User audit logs to clear:    ${userAuditLogsCount}`);
  console.log('────────────────────────────────────────────────────────────');
  console.log(`  🛡️ Preserved Institutions:    ${instCount}`);
  console.log(`  🛡️ Preserved Departments:     ${deptCount}`);
  console.log(`  🛡️ Preserved RBAC Roles:      ${roleCount}`);
  console.log(`  🛡️ Preserved SaaS Plans:      ${planCount}`);
  console.log(`  🛡️ Preserved Subscriptions:  ${subCount}`);
  console.log(`  🛡️ Preserved Payments:       ${payCount}`);
  console.log('============================================================\n');

  // ─── 3. EXECUTE PURGE OF USER DATA ─────────────────────────────────────────
  console.log('🧹 EXECUTING USER DATA PURGE...');

  // Delete user accounts
  const deletedUserRes = await User.deleteMany({ _id: { $in: usersToPurgeIds } });
  console.log(`  ✓ Removed ${deletedUserRes.deletedCount} user account(s)`);

  // Clear transient auth records for preserved Super Admin accounts
  if (preservedUserIds.length > 0) {
    await User.updateMany(
      { _id: { $in: preservedUserIds } },
      {
        $set: {
          refreshToken: null,
          resetPasswordToken: null,
          resetPasswordOtp: null,
          resetPasswordExpires: null,
          verificationToken: null,
          verificationTokenExpires: null,
          invitationToken: null,
          invitationExpires: null,
        },
      }
    );
    console.log(`  ✓ Invalidated old active sessions/tokens for ${preservedUserIds.length} preserved Super Admin(s)`);
  }

  // Delete user-dependent collections
  await InstitutionMembership.deleteMany({ userId: { $in: usersToPurgeIds } });
  await Verification.deleteMany({});
  await EmailChangeChallenge.deleteMany({});
  await Activity.deleteMany({ user: { $in: usersToPurgeIds } });
  await ActivityLog.deleteMany({ userId: { $in: usersToPurgeIds } });
  await RecruitmentNotification.deleteMany({ recipient: { $in: usersToPurgeIds } });
  await RecruiterBookmark.deleteMany({ recruiterId: { $in: usersToPurgeIds } });
  await RecruitmentPipeline.deleteMany({ candidateId: { $in: usersToPurgeIds } });
  await Job.deleteMany({ recruiterId: { $in: usersToPurgeIds } });
  await PlacementDrive.deleteMany({ createdBy: { $in: usersToPurgeIds } });
  await TeacherAnnouncement.deleteMany({ teacherId: { $in: usersToPurgeIds } });
  await Message.deleteMany({ $or: [{ sender: { $in: usersToPurgeIds } }, { recipient: { $in: usersToPurgeIds } }] });
  await Project.deleteMany({ user: { $in: usersToPurgeIds } });
  await Ranking.deleteMany({ user: { $in: usersToPurgeIds } });
  await Report.deleteMany({ $or: [{ reportedBy: { $in: usersToPurgeIds } }, { targetUser: { $in: usersToPurgeIds } }] });
  await SharedDocument.deleteMany({ user: { $in: usersToPurgeIds } });
  await TimelineEvent.deleteMany({ user: { $in: usersToPurgeIds } });
  await Badge.deleteMany({ user: { $in: usersToPurgeIds } });
  await CareerBadge.deleteMany({ user: { $in: usersToPurgeIds } });
  await Analytics.deleteMany({ user: { $in: usersToPurgeIds } });
  await LeetCodeAnalytics.deleteMany({ user: { $in: usersToPurgeIds } });
  await CareerAnalytics.deleteMany({ user: { $in: usersToPurgeIds } });
  await CareerInsight.deleteMany({ user: { $in: usersToPurgeIds } });
  await CareerScore.deleteMany({ user: { $in: usersToPurgeIds } });
  await CareerSkillAnalysis.deleteMany({ user: { $in: usersToPurgeIds } });
  await CareerTimeline.deleteMany({ user: { $in: usersToPurgeIds } });
  await Compatibility.deleteMany({ user: { $in: usersToPurgeIds } });
  await DNA.deleteMany({ user: { $in: usersToPurgeIds } });
  await Insight.deleteMany({ user: { $in: usersToPurgeIds } });
  await Company.deleteMany({ recruiterId: { $in: usersToPurgeIds } });
  await AuditLog.deleteMany({
    $or: [{ actorId: { $in: usersToPurgeIds } }, { targetUserId: { $in: usersToPurgeIds } }],
  });
  await WebhookLog.deleteMany({ userId: { $in: usersToPurgeIds } });

  // ─── 4. CLEAN ORPHANED REFERENCES IN PRESERVED DATA ────────────────────────
  await Department.updateMany({ headUserId: { $in: usersToPurgeIds } }, { $set: { headUserId: null } });
  await Department.updateMany({ createdBy: { $in: usersToPurgeIds } }, { $set: { createdBy: null } });
  await Institution.updateMany({ createdBy: { $in: usersToPurgeIds } }, { $set: { createdBy: null } });
  await Role.updateMany({ createdBy: { $in: usersToPurgeIds } }, { $set: { createdBy: null } });
  console.log('  ✓ Cleaned up orphaned references in preserved Institutions, Departments, and Roles');

  // ─── 5. SUPER ADMIN SEEDING / VERIFICATION ──────────────────────────────
  let superAdminStatus = 'PRESERVED';
  const remainingSuperAdmins = await User.countDocuments({
    $or: [{ role: 'super_admin' }, { roles: 'super_admin' }, { roles: 'platform_owner' }],
    institutionId: null,
  });

  if (remainingSuperAdmins === 0) {
    console.log('\n👑 No Platform Super Admin found after reset. Executing controlled Super Admin seed...');
    const seedEmail = process.env.SEED_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL || 'admin@mavilinking.com';
    const seedPass = process.env.SEED_ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD || 'AdminPass@123';
    const seedName = process.env.SEED_ADMIN_NAME || process.env.SUPER_ADMIN_NAME || 'Platform Super Admin';

    const hashedPassword = await bcrypt.hash(seedPass, 10);
    await User.create({
      name: seedName,
      email: seedEmail.toLowerCase().trim(),
      password: hashedPassword,
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
    superAdminStatus = 'SEEDED';
    console.log(`  ✓ Created Platform Super Admin: ${seedEmail}`);
  }

  // ─── 6. POST-RESET AUTOMATED VALIDATION ────────────────────────────────────
  console.log('\n🔍 RUNNING POST-RESET AUTOMATED INTEGRITY & REGISTRATION TESTS...');
  let validationPassed = true;
  const validationErrors = [];

  const postStudentCount = await User.countDocuments({ role: 'user', institutionId: { $ne: null } });
  const postTeacherCount = await User.countDocuments({ role: 'teacher' });
  const postRecruiterCount = await User.countDocuments({ role: 'recruiter' });
  const postInstAdminCount = await User.countDocuments({ role: 'institution_admin' });
  const postDeptAdminCount = await User.countDocuments({ role: 'department_admin' });

  if (postStudentCount !== 0) { validationPassed = false; validationErrors.push(`Students count is ${postStudentCount} (Expected: 0)`); }
  if (postTeacherCount !== 0) { validationPassed = false; validationErrors.push(`Teachers count is ${postTeacherCount} (Expected: 0)`); }
  if (postRecruiterCount !== 0) { validationPassed = false; validationErrors.push(`Recruiters count is ${postRecruiterCount} (Expected: 0)`); }
  if (postInstAdminCount !== 0) { validationPassed = false; validationErrors.push(`Institution Admins count is ${postInstAdminCount} (Expected: 0)`); }
  if (postDeptAdminCount !== 0) { validationPassed = false; validationErrors.push(`Department Admins count is ${postDeptAdminCount} (Expected: 0)`); }

  // Check existing institution code & department test
  const testInstitution = await Institution.findOne({ status: 'active' });
  let instCodeValidated = false;
  let deptsLoaded = false;
  let deptCountFound = 0;

  if (testInstitution) {
    const instCodeToTest = testInstitution.institutionCode || testInstitution.tenantId;
    const resolvedInst = await Institution.findOne({
      $or: [{ institutionCode: instCodeToTest }, { tenantId: instCodeToTest }],
    });

    if (resolvedInst) {
      instCodeValidated = true;
      const depts = await Department.find({ institutionId: resolvedInst._id, status: 'active' });
      deptCountFound = depts.length;
      if (deptCountFound > 0) {
        deptsLoaded = true;
      }
    }
  }

  if (!instCodeValidated || !deptsLoaded) {
    validationPassed = false;
    validationErrors.push('Existing Institution Code validation or Department resolution test failed.');
  }

  // Check orphaned records
  const orphanMemberships = await InstitutionMembership.countDocuments({});
  const orphanVerifications = await Verification.countDocuments({});

  if (orphanMemberships !== 0) { validationPassed = false; validationErrors.push(`Orphaned memberships remain: ${orphanMemberships}`); }
  if (orphanVerifications !== 0) { validationPassed = false; validationErrors.push(`Orphaned verifications remain: ${orphanVerifications}`); }

  // ─── 7. FINAL REPORT OUTPUT ───────────────────────────────────────────────
  console.log('\n============================================================');
  console.log('MAVI LINKING QA RESET');
  console.log(`Status: ${validationPassed ? 'SUCCESS' : 'FAILED'}`);
  console.log('============================================================\n');

  console.log(`User accounts removed:     ${deletedUserRes.deletedCount}`);
  console.log(`Students removed:          ${studentsCountToPurge}`);
  console.log(`Teachers removed:          ${teachersCountToPurge}`);
  console.log(`Recruiters removed:        ${recruitersCountToPurge}`);
  console.log(`Institution Admins removed:${instAdminsCountToPurge}`);
  console.log(`Department Admins removed: ${deptAdminsCountToPurge}`);
  console.log(`Sessions & tokens removed: ${usersToPurgeIds.length}`);
  console.log(`Verification records removed: ${verificationsCount}`);
  console.log(`Password reset records removed: CLEARED`);
  console.log(`Invitations removed:        CLEARED\n`);

  console.log(`Institution data:          PRESERVED (Count: ${await Institution.countDocuments({})})`);
  console.log(`Institution Codes:         PRESERVED & VALIDATED (${instCodeValidated ? 'PASSED' : 'FAILED'})`);
  console.log(`Departments:               PRESERVED (Count: ${await Department.countDocuments({})}, Loaded for registration: ${deptCountFound})`);
  console.log(`RBAC:                      PRESERVED (Roles: ${await Role.countDocuments({})})`);
  console.log(`Platform configuration:    PRESERVED`);
  console.log(`Payment configuration:     PRESERVED\n`);

  console.log(`Super Admin:               ${superAdminStatus}`);
  console.log(`Post-reset validation:     ${validationPassed ? 'PASSED' : 'FAILED'}`);

  if (validationErrors.length > 0) {
    console.error('\n⚠️ VALIDATION ERRORS DETECTED:');
    validationErrors.forEach((err) => console.error(`  - ${err}`));
  }

  console.log('\n============================================================\n');

  await mongoose.disconnect();

  if (!validationPassed) {
    process.exit(1);
  }
}

if (require.main === module) {
  resetUsersQA()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\n❌ RESET SCRIPT ERROR:', err);
      if (mongoose.connection.readyState !== 0) {
        mongoose.disconnect();
      }
      process.exit(1);
    });
}

module.exports = resetUsersQA;
