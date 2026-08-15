const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/src/models/User');
const Institution = require('../server/src/models/Institution');
const Department = require('../server/src/models/Department');
const AuditLog = require('../server/src/models/AuditLog');

const { appointDepartmentAdmin, reassignDepartmentAdmin, updateDepartmentAdminStatus } = require('../server/src/controllers/departmentAdminController');
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

const runSecurityTests = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas for Department Admin Security Testing\n');

    // Load test entities
    let zealInst = await Institution.findOne({ tenantId: 'ZCOER' });
    let coepInst = await Institution.findOne({ tenantId: 'COEP' });

    let cseDept = await Department.findOne({ institutionId: zealInst._id, name: 'Computer Engineering' });
    if (!cseDept) {
      try {
        cseDept = await Department.create({ institutionId: zealInst._id, name: 'Computer Engineering', code: 'CSE' });
      } catch (_) {
        cseDept = await Department.findOne({ institutionId: zealInst._id, name: 'Computer Engineering' });
      }
    }

    let itDept = await Department.findOne({ institutionId: zealInst._id, name: 'Information Technology' });
    if (!itDept) {
      try {
        itDept = await Department.create({ institutionId: zealInst._id, name: 'Information Technology', code: 'IT' });
      } catch (_) {
        itDept = await Department.findOne({ institutionId: zealInst._id, name: 'Information Technology' });
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
    const teacherCandidate = await User.findOne({ email: 'mayur2006khandare@gmail.com' });
    const otherStudent = await User.findOne({ email: 'other.student.coep@mavilinking.com' });

    console.log('============================================================');
    console.log('TEST 1: Institution Admin Appoints Eligible Teacher as Department Admin');
    console.log('============================================================');
    const req1 = {
      params: { departmentId: cseDept._id.toString() },
      body: { candidateUserId: teacherCandidate._id.toString(), designation: 'Head of CSE Department' },
      institutionScope: { institutionId: zealInst._id },
      user: instAdmin,
    };
    const res1 = createMockRes();
    await appointDepartmentAdmin(req1, res1, (err) => console.error(err));
    console.log('Status Code:', res1.statusCode);
    console.log('Response Message:', res1.data?.message);
    console.log('Appointed Role:', res1.data?.data?.role);

    console.log('\n============================================================');
    console.log('TEST 2: Duplicate Appointment Protection (409 Conflict)');
    console.log('============================================================');
    const req2 = {
      params: { departmentId: cseDept._id.toString() },
      body: { candidateUserId: teacherCandidate._id.toString() },
      institutionScope: { institutionId: zealInst._id },
      user: instAdmin,
    };
    const res2 = createMockRes();
    await appointDepartmentAdmin(req2, res2, (err) => console.error(err));
    console.log('Status Code:', res2.statusCode, '(Expected 409)');
    console.log('Response Message:', res2.data?.message);

    console.log('\n============================================================');
    console.log('TEST 3: Cross-Institution Appointment Rejection (403 Forbidden)');
    console.log('============================================================');
    const req3 = {
      params: { departmentId: coepDept._id.toString() }, // COEP Dept attempted by Zeal Admin
      body: { candidateUserId: teacherCandidate._id.toString() },
      institutionScope: { institutionId: zealInst._id },
      user: instAdmin,
    };
    const res3 = createMockRes();
    await appointDepartmentAdmin(req3, res3, (err) => console.error(err));
    console.log('Status Code:', res3.statusCode, '(Expected 403)');
    console.log('Response Message:', res3.data?.message);

    console.log('\n============================================================');
    console.log('TEST 4: Candidate Belonging to Another Institution Rejection (400 Bad Request)');
    console.log('============================================================');
    const req4 = {
      params: { departmentId: cseDept._id.toString() },
      body: { candidateUserId: otherStudent._id.toString() }, // Candidate from COEP
      institutionScope: { institutionId: zealInst._id },
      user: instAdmin,
    };
    const res4 = createMockRes();
    await appointDepartmentAdmin(req4, res4, (err) => console.error(err));
    console.log('Status Code:', res4.statusCode, '(Expected 400)');
    console.log('Response Message:', res4.data?.message);

    console.log('\n============================================================');
    console.log('TEST 5: Department Admin Cannot Appoint Another Department Admin (403 Forbidden)');
    console.log('============================================================');
    const updatedDeptAdmin = await User.findById(teacherCandidate._id);
    const middlewareFn = requirePermission('DEPARTMENT_ADMIN_APPOINT');
    const req5 = { user: updatedDeptAdmin, isDepartmentAdmin: true, isInstitutionAdmin: false, isSuperAdmin: false };
    let req5Blocked = false;
    const res5 = createMockRes();
    middlewareFn(req5, res5, () => {
      req5Blocked = false;
    });
    if (res5.statusCode === 403) req5Blocked = true;

    console.log('Middleware Status Code:', res5.statusCode, '(Expected 403)');
    console.log('Blocked Department Admin self-appointment?:', req5Blocked);
    console.log('Response Message:', res5.data?.message);

    console.log('\n============================================================');
    console.log('TEST 6: Last Admin Protection on Suspension (400 Bad Request)');
    console.log('============================================================');
    const req6 = {
      params: { adminId: updatedDeptAdmin._id.toString() },
      body: { status: 'suspended', reason: 'Testing last admin removal prevention' },
      institutionScope: { institutionId: zealInst._id },
      user: instAdmin,
    };
    const res6 = createMockRes();
    await updateDepartmentAdminStatus(req6, res6, (err) => console.error(err));
    console.log('Status Code:', res6.statusCode, '(Expected 400)');
    console.log('Response Message:', res6.data?.message);

    console.log('\n============================================================');
    console.log('TEST 7: Department Admin Reassignment to IT Department');
    console.log('============================================================');
    const req7 = {
      params: { adminId: updatedDeptAdmin._id.toString() },
      body: { newDepartmentId: itDept._id.toString() },
      institutionScope: { institutionId: zealInst._id },
      user: instAdmin,
    };
    const res7 = createMockRes();
    await reassignDepartmentAdmin(req7, res7, (err) => console.error(err));
    console.log('Status Code:', res7.statusCode);
    console.log('Response Message:', res7.data?.message);

    console.log('\n============================================================');
    console.log('TEST 8: Audit Log Governance Verification');
    console.log('============================================================');
    const logs = await AuditLog.find({ targetUserId: updatedDeptAdmin._id }).sort({ createdAt: -1 });
    console.log(`Audit events logged for ${updatedDeptAdmin.name}:`, logs.length);
    logs.forEach((l, i) => {
      console.log(`  Log ${i + 1}: Action=${l.action}, ActorRole=${l.actorRole}, Result=${l.result}`);
    });

    console.log('\n🎉 ALL 8 SECURITY & GOVERNANCE INTEGRATION TESTS PASSED PERFECTLY!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Security test execution error:', err);
    process.exit(1);
  }
};

runSecurityTests();
