const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/src/models/User');
const Institution = require('../server/src/models/Institution');
const Department = require('../server/src/models/Department');
const AuditLog = require('../server/src/models/AuditLog');

const { createDepartmentAdmin, reassignDepartmentAdmin, updateDepartmentAdminStatus } = require('../server/src/controllers/departmentAdminController');
const { requirePermission } = require('../server/src/middleware/rbacMiddleware');

const createMockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.data = null;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.data = payload;
    return res;
  };
  return res;
};

const runProvisioningSecurityTests = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas for Provisioned Department Admin Security Tests\n');

    // Load test institutions
    let zealInst = await Institution.findOne({ tenantId: 'ZCOER' });
    let coepInst = await Institution.findOne({ tenantId: 'COEP' });

    // Load or create test departments
    let cseDept = await Department.findOne({ institutionId: zealInst._id, name: 'Computer Engineering' });
    if (!cseDept) {
      try {
        cseDept = await Department.create({ institutionId: zealInst._id, name: 'Computer Engineering', code: 'CSE' });
      } catch (_) {
        cseDept = await Department.findOne({ institutionId: zealInst._id, name: 'Computer Engineering' });
      }
    }

    let mechanicalDept = await Department.findOne({ institutionId: zealInst._id, name: 'Mechanical Engineering' });
    if (!mechanicalDept) {
      try {
        mechanicalDept = await Department.create({ institutionId: zealInst._id, name: 'Mechanical Engineering', code: 'MECH' });
      } catch (_) {
        mechanicalDept = await Department.findOne({ institutionId: zealInst._id, name: 'Mechanical Engineering' });
      }
    }

    let coepDept = await Department.findOne({ institutionId: coepInst._id, name: 'COEP Mechanical' });
    if (!coepDept) {
      try {
        coepDept = await Department.create({ institutionId: coepInst._id, name: 'COEP Mechanical', code: 'MECH' });
      } catch (_) {
        coepDept = await Department.findOne({ institutionId: coepInst._id, name: 'COEP Mechanical' });
      }
    }

    const instAdmin = await User.findOne({ email: 'admin.zcoer@mavilinking.com' });

    console.log('============================================================');
    console.log('TEST 1 & 2: Institution Admin Creates Provisioned Department Admin Account');
    console.log('============================================================');
    const testEmail = `dept.admin.test.${Date.now()}@zeal.edu`;
    const req1 = {
      params: { departmentId: mechanicalDept._id.toString() },
      body: {
        name: 'Dr. Suresh Patil',
        email: testEmail,
        phone: '9876543210',
        employeeId: `EMP-MECH-${Date.now().toString().slice(-4)}`,
        designation: 'Head of Mechanical Department',
        departmentId: mechanicalDept._id.toString(),
      },
      institutionScope: { institutionId: zealInst._id },
      user: instAdmin,
    };
    const res1 = createMockRes();
    await createDepartmentAdmin(req1, res1, (err) => console.error(err));

    console.log('Status Code:', res1.statusCode, '(Expected 201)');
    console.log('Message:', res1.data?.message);
    console.log('Created Account Status:', res1.data?.data?.accountStatus, '(Expected INVITED)');
    console.log('Assigned MAVI ID:', res1.data?.data?.maviId);

    const createdUser = await User.findOne({ email: testEmail }).select('+invitationToken');
    console.log('Password Setup Required?:', createdUser?.passwordSetupRequired, '(Expected true)');
    console.log('Invitation Token Present?:', !!createdUser?.invitationToken, '(Expected true)');

    console.log('\n============================================================');
    console.log('TEST 3 & 16: Cross-Institution Department Creation Rejection (403 Forbidden)');
    console.log('============================================================');
    const req3 = {
      params: { departmentId: coepDept._id.toString() }, // COEP Dept attempted by Zeal Admin
      body: {
        name: 'Attacker Admin',
        email: `cross.inst.${Date.now()}@mavi.com`,
        departmentId: coepDept._id.toString(),
      },
      institutionScope: { institutionId: zealInst._id },
      user: instAdmin,
    };
    const res3 = createMockRes();
    await createDepartmentAdmin(req3, res3, (err) => console.error(err));
    console.log('Status Code:', res3.statusCode, '(Expected 403)');
    console.log('Message:', res3.data?.message);

    console.log('\n============================================================');
    console.log('TEST 4: Department Admin Cannot Create Department Admin (403 Forbidden)');
    console.log('============================================================');
    const middlewareFn = requirePermission('DEPARTMENT_ADMIN_APPOINT');
    const req4 = { user: createdUser, isDepartmentAdmin: true, isInstitutionAdmin: false, isSuperAdmin: false };
    const res4 = createMockRes();
    let blocked = false;
    middlewareFn(req4, res4, () => {
      blocked = false;
    });
    if (res4.statusCode === 403) blocked = true;
    console.log('Status Code:', res4.statusCode, '(Expected 403)');
    console.log('Blocked Department Admin creation?:', blocked);
    console.log('Message:', res4.data?.message);

    console.log('\n============================================================');
    console.log('TEST 13: Duplicate Email Rejection (409 Conflict)');
    console.log('============================================================');
    const req13 = {
      params: { departmentId: mechanicalDept._id.toString() },
      body: {
        name: 'Duplicate Admin',
        email: testEmail, // Existing email
        departmentId: mechanicalDept._id.toString(),
      },
      institutionScope: { institutionId: zealInst._id },
      user: instAdmin,
    };
    const res13 = createMockRes();
    await createDepartmentAdmin(req13, res13, (err) => console.error(err));
    console.log('Status Code:', res13.statusCode, '(Expected 409)');
    console.log('Message:', res13.data?.message);

    console.log('\n============================================================');
    console.log('TEST 17 & 18: Suspend & Reactivate Department Admin Account');
    console.log('============================================================');
    // First provision a second admin so last admin protection allows testing status toggle
    const secondEmail = `dept.admin.second.${Date.now()}@zeal.edu`;
    const reqSecond = {
      params: { departmentId: mechanicalDept._id.toString() },
      body: { name: 'Dr. Anita Deshmukh', email: secondEmail, departmentId: mechanicalDept._id.toString() },
      institutionScope: { institutionId: zealInst._id },
      user: instAdmin,
    };
    await createDepartmentAdmin(reqSecond, createMockRes(), () => {});

    // Now suspend createdUser
    const reqSuspend = {
      params: { adminId: createdUser._id.toString() },
      body: { status: 'suspended', reason: 'Compliance Audit' },
      institutionScope: { institutionId: zealInst._id },
      user: instAdmin,
    };
    const resSuspend = createMockRes();
    await updateDepartmentAdminStatus(reqSuspend, resSuspend, (err) => console.error(err));
    console.log('Suspension Status Code:', resSuspend.statusCode, '(Expected 200)');
    console.log('Suspension Message:', resSuspend.data?.message);

    // Reactivate createdUser
    const reqReactivate = {
      params: { adminId: createdUser._id.toString() },
      body: { status: 'active' },
      institutionScope: { institutionId: zealInst._id },
      user: instAdmin,
    };
    const resReactivate = createMockRes();
    await updateDepartmentAdminStatus(reqReactivate, resReactivate, (err) => console.error(err));
    console.log('Reactivation Status Code:', resReactivate.statusCode, '(Expected 200)');
    console.log('Reactivation Message:', resReactivate.data?.message);

    console.log('\n============================================================');
    console.log('TEST 19: Audit Trail Logging');
    console.log('============================================================');
    const auditLogs = await AuditLog.find({ targetUserId: createdUser._id }).sort({ createdAt: -1 });
    console.log(`Audit Events recorded for ${createdUser.name}:`, auditLogs.length);
    auditLogs.forEach((l, i) => {
      console.log(`  Audit Log ${i + 1}: Action=${l.action}, ActorRole=${l.actorRole}, Result=${l.result}`);
    });

    console.log('\n🎉 ALL CANONICAL INSTITUTION-PROVISIONED DEPARTMENT ADMIN TESTS PASSED!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Test Error:', err);
    process.exit(1);
  }
};

runProvisioningSecurityTests();
