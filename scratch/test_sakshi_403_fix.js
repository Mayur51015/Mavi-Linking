const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/src/models/User');
const { getStudentProfileForAdmin } = require('../server/src/controllers/adminController');
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

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const sakshi = await User.findOne({ email: 'sakshid172006@gmail.com' });
    const studentMK = await User.findById('6a7ed8b0e0cb2d88b4a03512');

    console.log('Testing Sakshi D (Institution Admin with legacy permissions array):');
    console.log('  Admin Name:', sakshi.name, '| Role:', sakshi.role, '| InstId:', sakshi.institutionId);
    console.log('  Admin Permissions:', sakshi.permissions);
    console.log('  Student Name:', studentMK.name, '| InstId:', studentMK.institutionId);

    // Test 1: requirePermission middleware check
    const middlewareFn = requirePermission('STUDENT_PROFILE_MANAGE');
    const req1 = { user: sakshi, isInstitutionAdmin: true };
    let middlewarePassed = false;
    middlewareFn(req1, createMockRes(), () => {
      middlewarePassed = true;
    });

    console.log('\nMiddleware requirePermission test:');
    console.log('  Passed middleware check?:', middlewarePassed);

    // Test 2: getStudentProfileForAdmin controller check
    const req2 = {
      params: { studentId: '6a7ed8b0e0cb2d88b4a03512' },
      institutionScope: { institutionId: sakshi.institutionId },
      user: sakshi,
    };
    const res2 = createMockRes();
    await getStudentProfileForAdmin(req2, res2, (err) => console.error(err));

    console.log('\nController getStudentProfileForAdmin test:');
    console.log('  Response Status Code:', res2.statusCode);
    console.log('  Student Name returned:', res2.data?.data?.name);
    console.log('  MAVI ID 🔒:', res2.data?.data?.maviId);

    if (res2.statusCode === 200 && middlewarePassed) {
      console.log('\n🎉 BUG FIXED! Sakshi D can successfully view and update student profile without 403 Forbidden!');
    } else {
      console.error('\n❌ Test failed with status code:', res2.statusCode);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error during test:', err);
    process.exit(1);
  }
};

run();
