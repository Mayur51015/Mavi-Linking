const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking';

/**
 * 🔒 PRODUCTION ENVIRONMENT GUARD
 */
if (process.env.NODE_ENV === 'production') {
  console.error('\n❌ [FATAL SAFETY BLOCK] Demo database reset is strictly disabled in PRODUCTION environment!');
  process.exit(1);
}

// Models
const User = require('../models/User');
const Institution = require('../models/Institution');
const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');
const ActivityLog = require('../models/ActivityLog');
const RecruitmentNotification = require('../models/RecruitmentNotification');
const InstitutionMembership = require('../models/InstitutionMembership');

async function resetDemoDatabase() {
  console.log('============================================================');
  console.log('MAVI LINKING — CLEAN DEMO DATABASE RESET & SEEDING');
  console.log('============================================================\n');

  await mongoose.connect(mongoUri);
  console.log(`✅ Connected to MongoDB database: ${mongoose.connection.name}`);

  // ─── 1. DEPENDENCY MAP & PRESERVED ACCOUNTS ─────────────────────────────
  const allUsers = await User.find({});
  const superAdminEmails = [
    'mayurek51015@gmail.com',
    'mayur1718khandare@gmail.com',
    'khandaremayur420@gmail.com',
    'mayur@gmail.com',
    'armansunasara70@gmail.com',
    'mavi118@gmail.com',
  ];

  // Identify accounts to preserve (Platform Super Admins)
  const preservedUserIds = [];
  const usersToPurgeIds = [];

  for (const user of allUsers) {
    const isSuperAdminRole =
      user.role === 'super_admin' ||
      user.role === 'platform_owner' ||
      (Array.isArray(user.roles) && (user.roles.includes('super_admin') || user.roles.includes('platform_owner')));

    const isPlatformEmail = superAdminEmails.includes(user.email.toLowerCase());

    if ((isSuperAdminRole || isPlatformEmail) && !user.institutionId) {
      preservedUserIds.push(user._id.toString());
      console.log(`🛡️ PRESERVING PLATFORM ADMIN: ${user.name} (${user.email}) [Role: ${user.role}]`);
    } else {
      usersToPurgeIds.push(user._id);
    }
  }

  const existingInstitutions = await Institution.find({});
  const existingDepartments = await Department.find({});

  console.log(`\n📊 DEPENDENCY MAP SUMMARY BEFORE RESET:`);
  console.log(`   - Total Users in DB: ${allUsers.length}`);
  console.log(`   - Preserved Platform Super Admins: ${preservedUserIds.length}`);
  console.log(`   - Tenant Users to Purge: ${usersToPurgeIds.length}`);
  console.log(`   - Old Institutions to Delete: ${existingInstitutions.length}`);
  console.log(`   - Old Departments to Delete: ${existingDepartments.length}`);

  // ─── 2. CASCADE CLEANUP OF LEGACY DEMO DATA ──────────────────────────────
  console.log('\n🧹 PERFORMING CASCADE CLEANUP OF LEGACY DATA...');

  // Delete old institutions and departments
  const instDeleteResult = await Institution.deleteMany({});
  const deptDeleteResult = await Department.deleteMany({});
  console.log(`   - Deleted ${instDeleteResult.deletedCount} old institution(s)`);
  console.log(`   - Deleted ${deptDeleteResult.deletedCount} old department(s)`);

  // Purge non-platform users
  const userDeleteResult = await User.deleteMany({ _id: { $in: usersToPurgeIds } });
  console.log(`   - Purged ${userDeleteResult.deletedCount} legacy test user account(s)`);

  // Clean up tenant-scoped logs & references
  const auditCleanResult = await AuditLog.deleteMany({ targetUserId: { $in: usersToPurgeIds } });
  const activityCleanResult = await ActivityLog.deleteMany({ userId: { $in: usersToPurgeIds } });
  const notifCleanResult = await RecruitmentNotification.deleteMany({ recipient: { $in: usersToPurgeIds } });
  const memCleanResult = await InstitutionMembership.deleteMany({ userId: { $in: usersToPurgeIds } });

  console.log(`   - Cleared ${auditCleanResult.deletedCount} tenant audit log record(s)`);
  console.log(`   - Cleared ${activityCleanResult.deletedCount} tenant activity log record(s)`);
  console.log(`   - Cleared ${notifCleanResult.deletedCount} tenant notification record(s)`);
  console.log(`   - Cleared ${memCleanResult.deletedCount} institution membership record(s)`);

  // ─── 3. FRESH INSTITUTION CREATION ──────────────────────────────────────
  console.log('\n🏛️ CREATING FRESH INSTITUTION DATASET...');

  const freshInstitution = await Institution.create({
    name: 'MAVI Demo Institution',
    institutionCode: 'MAVI-DEMO-001',
    code: 'MAVI-DEMO-001',
    tenantId: 'MAVI-DEMO-001',
    shortName: 'MAVI DEMO',
    domain: 'demo.mavilinking.com',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    status: 'active',
    primaryContact: {
      email: 'admin.demo@mavilinking.com',
      phone: '+919876543210',
    },
  });

  console.log(`✅ Created Fresh Institution: "${freshInstitution.name}" [Code: ${freshInstitution.institutionCode}]`);

  // ─── 4. FRESH DEPARTMENTS CREATION ──────────────────────────────────────
  const deptDefs = [
    { name: 'Computer Engineering', code: 'CSE', description: 'Department of Computer Engineering & Computer Science' },
    { name: 'Information Technology', code: 'IT', description: 'Department of Information Technology & Information Systems' },
    { name: 'Electronics & Telecommunication', code: 'ENTC', description: 'Department of Electronics and Telecommunication' },
    { name: 'Mechanical Engineering', code: 'MECH', description: 'Department of Mechanical Engineering' },
    { name: 'Civil Engineering', code: 'CIVIL', description: 'Department of Civil Engineering' },
  ];

  const createdDepartments = {};
  for (const def of deptDefs) {
    const dept = await Department.create({
      institutionId: freshInstitution._id,
      name: def.name,
      code: def.code,
      description: def.description,
      status: 'active',
    });
    createdDepartments[def.code] = dept;
    console.log(`   └─ Created Department: "${dept.name}" (${dept.code}) [ID: ${dept._id}]`);
  }

  // ─── 5. USER CREDENTIALS & SEED PASSWORD CONFIGURATION ──────────────────
  const seedRawPassword = process.env.SEED_INSTITUTION_ADMIN_PASSWORD || 'DemoPass@123';
  const hashedPassword = await bcrypt.hash(seedRawPassword, 10);

  // ─── 6. FRESH INSTITUTION ADMIN ─────────────────────────────────────────
  const freshInstAdmin = await User.create({
    name: 'MAVI Demo Institution Admin',
    email: 'admin.demo@mavilinking.com',
    password: hashedPassword,
    role: 'institution_admin',
    roles: ['institution_admin', 'admin', 'user'],
    status: 'active',
    accountStatus: 'ACTIVE',
    institutionId: freshInstitution._id,
    tenantId: freshInstitution.institutionCode,
    maviId: 'MAVI-IADMIN-DEMO01',
    isVerified: true,
    emailVerified: true,
    university: {
      name: freshInstitution.name,
    },
  });
  console.log(`\n👑 Created Institution Admin: ${freshInstAdmin.name} (${freshInstAdmin.email}) [MAVI: ${freshInstAdmin.maviId}]`);

  // ─── 7. FRESH DEPARTMENT ADMINS ────────────────────────────────────────
  const deptAdminsMap = {};
  for (const code of Object.keys(createdDepartments)) {
    const dept = createdDepartments[code];
    const deptEmail = `${code.toLowerCase()}.admin.demo@mavilinking.com`;

    const deptAdmin = await User.create({
      name: `${code} Department Admin`,
      email: deptEmail,
      password: hashedPassword,
      role: 'department_admin',
      roles: ['department_admin', 'user'],
      status: 'active',
      accountStatus: 'ACTIVE',
      institutionId: freshInstitution._id,
      departmentId: dept._id,
      tenantId: freshInstitution.institutionCode,
      maviId: `MAVI-DADMIN-${code}`,
      isVerified: true,
      emailVerified: true,
      university: {
        name: freshInstitution.name,
        department: dept.name,
      },
    });

    // Update headUserId on Department
    dept.headUserId = deptAdmin._id;
    await dept.save();

    deptAdminsMap[code] = deptAdmin;
    console.log(`   └─ Created Department Admin [${code}]: ${deptAdmin.name} (${deptAdmin.email})`);
  }

  // ─── 8. FRESH CONTROLLED STUDENTS (10 total, varied account states) ─────
  const studentDefs = [
    // CSE
    { name: 'CSE Student 01', email: 'student.cse01@demo.mavilinking.com', prn: 'PRN-CSE-001', deptCode: 'CSE', accountStatus: 'ACTIVE', isVerified: true, emailVerified: true },
    { name: 'CSE Student 02', email: 'student.cse02@demo.mavilinking.com', prn: 'PRN-CSE-002', deptCode: 'CSE', accountStatus: 'PENDING_ADMIN_APPROVAL', isVerified: true, emailVerified: true },

    // IT
    { name: 'IT Student 01', email: 'student.it01@demo.mavilinking.com', prn: 'PRN-IT-001', deptCode: 'IT', accountStatus: 'PENDING_EMAIL_VERIFICATION', isVerified: false, emailVerified: false },
    { name: 'IT Student 02', email: 'student.it02@demo.mavilinking.com', prn: 'PRN-IT-002', deptCode: 'IT', accountStatus: 'ACTIVE', isVerified: true, emailVerified: true },

    // ENTC
    { name: 'ENTC Student 01', email: 'student.entc01@demo.mavilinking.com', prn: 'PRN-ENTC-001', deptCode: 'ENTC', accountStatus: 'ACTIVE', isVerified: true, emailVerified: true },
    { name: 'ENTC Student 02', email: 'student.entc02@demo.mavilinking.com', prn: 'PRN-ENTC-002', deptCode: 'ENTC', accountStatus: 'REJECTED', isVerified: true, emailVerified: true, rejectionReason: 'Invalid identity document' },

    // MECH
    { name: 'MECH Student 01', email: 'student.mech01@demo.mavilinking.com', prn: 'PRN-MECH-001', deptCode: 'MECH', accountStatus: 'ACTIVE', isVerified: true, emailVerified: true },
    { name: 'MECH Student 02', email: 'student.mech02@demo.mavilinking.com', prn: 'PRN-MECH-002', deptCode: 'MECH', accountStatus: 'PENDING_ADMIN_APPROVAL', isVerified: true, emailVerified: true },

    // CIVIL
    { name: 'CIVIL Student 01', email: 'student.civil01@demo.mavilinking.com', prn: 'PRN-CIVIL-001', deptCode: 'CIVIL', accountStatus: 'ACTIVE', isVerified: true, emailVerified: true },
    { name: 'CIVIL Student 02', email: 'student.civil02@demo.mavilinking.com', prn: 'PRN-CIVIL-002', deptCode: 'CIVIL', accountStatus: 'PENDING_EMAIL_VERIFICATION', isVerified: false, emailVerified: false },
  ];

  console.log('\n🎓 CREATING CONTROLLED STUDENT DATASET (10 Students across 5 Depts)...');
  let studentCount = 0;
  for (const s of studentDefs) {
    studentCount++;
    const dept = createdDepartments[s.deptCode];
    const studentMaviId = `MAVI-STU-${s.deptCode}-${String(studentCount).padStart(2, '0')}`;

    await User.create({
      name: s.name,
      email: s.email,
      password: hashedPassword,
      role: 'user',
      roles: ['user'],
      status: 'active',
      accountStatus: s.accountStatus,
      prn: s.prn,
      institutionalIdentifier: {
        identifierType: 'PRN',
        identifierValue: s.prn,
      },
      institutionId: freshInstitution._id,
      departmentId: dept._id,
      tenantId: freshInstitution.institutionCode,
      maviId: studentMaviId,
      degree: 'B.Tech',
      graduationYear: '2026',
      isVerified: s.isVerified,
      emailVerified: s.emailVerified,
      rejectionReason: s.rejectionReason || '',
      university: {
        name: freshInstitution.name,
        department: dept.name,
        graduationYear: '2026',
      },
    });

    console.log(`   └─ Student: ${s.name} | Dept: ${s.deptCode} | PRN: ${s.prn} | Status: ${s.accountStatus}`);
  }

  // ─── 9. FRESH TEACHERS (2 total) ────────────────────────────────────────
  console.log('\n👨‍🏫 CREATING FRESH CONTROLLED TEACHERS (2 Teachers)...');
  const teacherDefs = [
    { name: 'Prof. CSE Faculty', email: 'teacher.cse01@demo.mavilinking.com', deptCode: 'CSE' },
    { name: 'Prof. IT Faculty', email: 'teacher.it01@demo.mavilinking.com', deptCode: 'IT' },
  ];

  for (let idx = 0; idx < teacherDefs.length; idx++) {
    const t = teacherDefs[idx];
    const dept = createdDepartments[t.deptCode];
    await User.create({
      name: t.name,
      email: t.email,
      password: hashedPassword,
      role: 'teacher',
      roles: ['teacher', 'user'],
      status: 'active',
      accountStatus: 'ACTIVE',
      institutionId: freshInstitution._id,
      departmentId: dept._id,
      tenantId: freshInstitution.institutionCode,
      maviId: `MAVI-TCH-${t.deptCode}-0${idx + 1}`,
      isVerified: true,
      emailVerified: true,
      designation: 'Assistant Professor',
      university: {
        name: freshInstitution.name,
        department: dept.name,
      },
    });
    console.log(`   └─ Teacher: ${t.name} (${t.email}) | Dept: ${t.deptCode}`);
  }

  // ─── 10. FRESH RECRUITERS (2 total) ──────────────────────────────────────
  console.log('\n💼 CREATING FRESH CONTROLLED RECRUITERS (2 Recruiters)...');
  const recruiterDefs = [
    { name: 'Recruiter Tech Corp', email: 'recruiter.demo01@mavilinking.com', companyName: 'TechCorp Solutions' },
    { name: 'Recruiter Global Systems', email: 'recruiter.demo02@mavilinking.com', companyName: 'Global Systems Inc' },
  ];

  for (let idx = 0; idx < recruiterDefs.length; idx++) {
    const r = recruiterDefs[idx];
    await User.create({
      name: r.name,
      email: r.email,
      password: hashedPassword,
      role: 'recruiter',
      roles: ['recruiter'],
      status: 'active',
      accountStatus: 'ACTIVE',
      maviId: `MAVI-REC-DEMO0${idx + 1}`,
      companyName: r.companyName,
      isVerified: true,
      emailVerified: true,
    });
    console.log(`   └─ Recruiter: ${r.name} (${r.email}) | Company: ${r.companyName}`);
  }

  // ─── 11. FINAL INTEGRITY & ORPHAN VALIDATION ────────────────────────────
  console.log('\n============================================================');
  console.log('FINAL DATABASE INVENTORY & INTEGRITY REPORT');
  console.log('============================================================');

  const finalInstCount = await Institution.countDocuments({});
  const finalDeptCount = await Department.countDocuments({});
  const finalUserCount = await User.countDocuments({});
  const finalSuperAdmins = await User.countDocuments({
    $or: [{ role: 'super_admin' }, { roles: 'super_admin' }, { roles: 'platform_owner' }],
    institutionId: null,
  });

  const finalInstAdmins = await User.countDocuments({ role: 'institution_admin' });
  const finalDeptAdmins = await User.countDocuments({ role: 'department_admin' });
  const finalStudents = await User.countDocuments({ role: 'user', institutionId: { $ne: null } });
  const finalTeachers = await User.countDocuments({ role: 'teacher' });
  const finalRecruiters = await User.countDocuments({ role: 'recruiter' });

  // Orphan checks
  const orphanedUsers = await User.countDocuments({
    institutionId: { $ne: null, $nin: [freshInstitution._id] },
  });
  const orphanedDepts = await Department.countDocuments({
    institutionId: { $nin: [freshInstitution._id] },
  });

  console.log(`🏛️ INSTITUTIONS: ${finalInstCount} (Expected: 1) [Code: MAVI-DEMO-001]`);
  console.log(`🏢 DEPARTMENTS: ${finalDeptCount} (Expected: 5) [CSE, IT, ENTC, MECH, CIVIL]`);
  console.log(`🛡️ PRESERVED SUPER ADMINS: ${finalSuperAdmins}`);
  console.log(`👑 INSTITUTION ADMINS: ${finalInstAdmins}`);
  console.log(`👔 DEPARTMENT ADMINS: ${finalDeptAdmins}`);
  console.log(`🎓 DEMO STUDENTS: ${finalStudents}`);
  console.log(`👨‍🏫 DEMO TEACHERS: ${finalTeachers}`);
  console.log(`💼 DEMO RECRUITERS: ${finalRecruiters}`);
  console.log(`TOTAL DB USERS: ${finalUserCount}`);

  console.log(`\n🔍 ORPHAN & DUPLICATE CHECKS:`);
  console.log(`   - Orphaned Users: ${orphanedUsers} (Expected: 0)`);
  console.log(`   - Orphaned Departments: ${orphanedDepts} (Expected: 0)`);

  if (orphanedUsers === 0 && orphanedDepts === 0 && finalInstCount === 1 && finalDeptCount === 5) {
    console.log(`\n✨ RESET & FRESH SEED COMPLETED SUCCESSFULLY! All checks passed.`);
  } else {
    console.warn(`\n⚠️ Reset completed with warnings. Check counts above.`);
  }

  await mongoose.disconnect();
}

// Execute if run directly from command line
if (require.main === module) {
  resetDemoDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\n❌ RESET SCRIPT ERROR:', err);
      process.exit(1);
    });
}

module.exports = resetDemoDatabase;
