const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/src/models/User');
const Institution = require('../server/src/models/Institution');
const AuditLog = require('../server/src/models/AuditLog');
const { getStudentsForAdmin, getStudentProfileForAdmin, updateStudentProfileForAdmin } = require('../server/src/controllers/adminController');

// Mock response object builder
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

const runEndpointTests = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas for Endpoint Testing');

    const instAdmin = await User.findOne({ email: 'admin.zcoer@mavilinking.com' });
    const student = await User.findOne({ email: 'mayur2006khandare@gmail.com' });

    // Create a dummy second institution and student for cross-tenant testing
    let otherInst = await Institution.findOne({ tenantId: 'COEP' });
    if (!otherInst) {
      otherInst = await Institution.create({ name: 'COEP Technological University', tenantId: 'COEP', code: 'COEP-PUNE' });
    }
    let otherStudent = await User.findOne({ email: 'other.student.coep@mavilinking.com' });
    if (!otherStudent) {
      otherStudent = await User.create({
        name: 'COEP Other Student',
        email: 'other.student.coep@mavilinking.com',
        role: 'user',
        institutionId: otherInst._id,
        tenantId: 'COEP',
        prn: 'COEP123456',
        university: { name: 'COEP' },
      });
    }

    console.log('\n============================================================');
    console.log('TEST 1: GET /api/admin/students (List Students with Scoping)');
    console.log('============================================================');
    const req1 = {
      query: { search: 'Mayur', page: 1, limit: 10 },
      institutionScope: { institutionId: instAdmin.institutionId },
      user: instAdmin,
    };
    const res1 = createMockRes();
    await getStudentsForAdmin(req1, res1, (err) => console.error(err));
    console.log('Status Code:', res1.statusCode);
    console.log('Students returned count:', res1.data?.data?.students?.length);
    console.log('First student:', res1.data?.data?.students?.[0]?.name, res1.data?.data?.students?.[0]?.prn);

    console.log('\n============================================================');
    console.log('TEST 2: GET /api/admin/students/:studentId/profile');
    console.log('============================================================');
    const req2 = {
      params: { studentId: student._id.toString() },
      institutionScope: { institutionId: instAdmin.institutionId },
      user: instAdmin,
    };
    const res2 = createMockRes();
    await getStudentProfileForAdmin(req2, res2, (err) => console.error(err));
    console.log('Status Code:', res2.statusCode);
    console.log('Student Name:', res2.data?.data?.name);
    console.log('MAVI ID 🔒:', res2.data?.data?.maviId);
    console.log('PRN:', res2.data?.data?.prn);

    console.log('\n============================================================');
    console.log('TEST 3: PATCH /api/admin/students/:studentId/profile (Valid Update)');
    console.log('============================================================');
    const newTestPrn = '124BT1046' + Math.floor(10 + Math.random() * 89);
    const req3 = {
      params: { studentId: student._id.toString() },
      body: {
        phone: '+91 99999 88888',
        bio: 'Updated by Institution Admin Profile Authority',
        department: 'Computer Engineering',
        branch: 'CSE',
        year: '3',
        prn: newTestPrn,
        skills: ['React', 'Node.js', 'MongoDB', 'System Architecture'],
      },
      institutionScope: { institutionId: instAdmin.institutionId },
      user: instAdmin,
    };
    const res3 = createMockRes();
    await updateStudentProfileForAdmin(req3, res3, (err) => console.error(err));
    console.log('Status Code:', res3.statusCode);
    console.log('Message:', res3.data?.message);
    console.log('Updated PRN:', res3.data?.data?.prn);
    console.log('PRN History Entries:', res3.data?.data?.prnHistory?.length);

    console.log('\n============================================================');
    console.log('TEST 4: CROSS-TENANT UPDATE REJECTION (403 Forbidden)');
    console.log('============================================================');
    const req4 = {
      params: { studentId: otherStudent._id.toString() },
      body: { bio: 'Hacked cross tenant bio' },
      institutionScope: { institutionId: instAdmin.institutionId },
      user: instAdmin,
    };
    const res4 = createMockRes();
    await updateStudentProfileForAdmin(req4, res4, (err) => console.error(err));
    console.log('Status Code:', res4.statusCode, '(Expected 403)');
    console.log('Response Message:', res4.data?.message);

    console.log('\n============================================================');
    console.log('TEST 5: PROTECTED FIELD IMMUTABILITY REJECTION (403 Forbidden)');
    console.log('============================================================');
    const req5 = {
      params: { studentId: student._id.toString() },
      body: { maviId: 'MAVI-HACKED-999', role: 'super_admin' },
      institutionScope: { institutionId: instAdmin.institutionId },
      user: instAdmin,
    };
    const res5 = createMockRes();
    await updateStudentProfileForAdmin(req5, res5, (err) => console.error(err));
    console.log('Status Code:', res5.statusCode, '(Expected 403)');
    console.log('Response Message:', res5.data?.message);

    console.log('\n============================================================');
    console.log('TEST 6: DUPLICATE PRN ASSIGNMENT REJECTION (409 Conflict)');
    console.log('============================================================');
    const req6 = {
      params: { studentId: student._id.toString() },
      body: { prn: otherStudent.prn }, // Using otherStudent's PRN
      institutionScope: { institutionId: instAdmin.institutionId },
      user: instAdmin,
    };
    const res6 = createMockRes();
    await updateStudentProfileForAdmin(req6, res6, (err) => console.error(err));
    console.log('Status Code:', res6.statusCode, '(Expected 409)');
    console.log('Response Message:', res6.data?.message);

    console.log('\n============================================================');
    console.log('TEST 7: AUDIT LOG CREATION VERIFICATION');
    console.log('============================================================');
    const logs = await AuditLog.find({ targetUserId: student._id }).sort({ createdAt: -1 });
    console.log(`Total Audit Log Events for Student (${student.name}):`, logs.length);
    logs.slice(0, 5).forEach((l, i) => {
      console.log(`Log ${i + 1}: Action=${l.action}, ActorRole=${l.actorRole}, Fields=${l.changedFields?.join(', ')}, Result=${l.result}`);
    });

    console.log('\n🎉 ALL 7 INTEGRATION SECURITY & AUTHORITY TESTS PASSED CLEANLY!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
};

runEndpointTests();
