const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/src/models/User');
const Institution = require('../server/src/models/Institution');
const InstitutionMembership = require('../server/src/models/InstitutionMembership');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // 1. Find or create Zeal College Institution
    let zeal = await Institution.findOne({ tenantId: 'ZCOER' });
    if (!zeal) {
      zeal = await Institution.create({
        name: 'Zeal College of Engineering & Research',
        tenantId: 'ZCOER',
        code: 'ZCOER-PUNE',
        shortName: 'ZCOER',
        officialDomain: 'zcoer.edu.in',
        domain: 'zcoer.edu.in',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        status: 'active',
      });
      console.log('Created Zeal College Institution:', zeal._id);
    } else {
      console.log('Found Zeal College Institution:', zeal._id);
    }

    // 2. Assign admin.zcoer@mavilinking.com to Zeal institution
    const instAdmin = await User.findOne({ email: 'admin.zcoer@mavilinking.com' });
    if (instAdmin) {
      instAdmin.institutionId = zeal._id;
      instAdmin.tenantId = 'ZCOER';
      instAdmin.university = {
        name: zeal.name,
        department: 'Administration',
      };
      if (!instAdmin.permissions || instAdmin.permissions.length === 0) {
        instAdmin.permissions = ['STUDENT_PROFILE_MANAGE', 'TEACHER_MANAGE', 'ANNOUNCEMENT_CREATE', 'DEPARTMENT_MANAGE'];
      } else if (!instAdmin.permissions.includes('STUDENT_PROFILE_MANAGE')) {
        instAdmin.permissions.push('STUDENT_PROFILE_MANAGE');
      }
      await instAdmin.save();
      console.log('Updated instAdmin:', instAdmin.email, 'with institutionId:', zeal._id, 'and STUDENT_PROFILE_MANAGE permission.');

      // Update InstitutionMembership
      await InstitutionMembership.findOneAndUpdate(
        { userId: instAdmin._id, institutionId: zeal._id },
        {
          userId: instAdmin._id,
          institutionId: zeal._id,
          tenantId: 'ZCOER',
          role: 'institution_admin',
          status: 'active',
        },
        { upsert: true, new: true }
      );
    }

    // 3. Assign student mayur2006khandare@gmail.com to Zeal institution
    const student = await User.findOne({ email: 'mayur2006khandare@gmail.com' });
    if (student) {
      student.institutionId = zeal._id;
      student.tenantId = 'ZCOER';
      if (!student.university) student.university = {};
      student.university.name = zeal.name;
      student.university.department = 'Computer Engineering';
      student.university.branch = 'CSE';
      student.university.year = '2';
      student.university.division = 'A';
      student.university.semester = '4';
      student.university.admissionYear = '2024';
      student.university.graduationYear = '2028';
      await student.save();
      console.log('Updated student:', student.email, 'with institutionId:', zeal._id);

      await InstitutionMembership.findOneAndUpdate(
        { userId: student._id, institutionId: zeal._id },
        {
          userId: student._id,
          institutionId: zeal._id,
          tenantId: 'ZCOER',
          role: 'student',
          status: 'active',
        },
        { upsert: true, new: true }
      );
    }

    console.log('✅ Institution & Membership Seeding Complete!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error seeding institution:', err);
    process.exit(1);
  }
};

seed();
