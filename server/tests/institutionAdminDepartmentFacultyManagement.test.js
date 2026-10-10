const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');

const User = require('../src/models/User');
const Institution = require('../src/models/Institution');
const Department = require('../src/models/Department');

jest.setTimeout(40000);

describe('EduTalentX — Institution Admin Department & Faculty Management Integration Tests', () => {
  let app;
  let superAdmin, superAdminToken;
  let instAdminA, instAdminAToken;
  let instAdminB, instAdminBToken;
  let facultyA1, facultyA2;
  let facultyB;
  let studentUser, studentToken;
  let institutionA, institutionB, institutionEmpty;
  let departmentA1, departmentA2, departmentB, archivedDeptA;

  const timestamp = Date.now() + '_' + Math.random().toString(36).substring(7);

  const generateToken = (user) => {
    return jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'ci-test-secret-key-mavi-linking-2026',
      { expiresIn: '2h' }
    );
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'ci-test-secret-key-mavi-linking-2026';

    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking_test';
      await mongoose.connect(mongoUri);
    }

    app = express();
    app.use(express.json());
    app.use('/api/admin', require('../src/routes/adminRoutes'));
    app.use(require('../src/middleware/errorHandler'));

    // Clean up test collections for isolation
    await User.deleteMany({ email: /.*_deptmgmt_test@example\.com$/ });
    await Institution.deleteMany({ institutionCode: /.*_DM_INST$/ });
    await Department.deleteMany({ code: /.*_DM_DEPT$/ });

    // 1. Create Institutions
    institutionA = await Institution.create({
      name: `Apex University ${timestamp}`,
      institutionCode: `A_${timestamp.slice(0, 4)}_DM_INST`.toUpperCase(),
      tenantId: `INST-APEX-${timestamp.slice(0, 4)}`,
      status: 'active',
    });

    institutionB = await Institution.create({
      name: `Beacon College ${timestamp}`,
      institutionCode: `B_${timestamp.slice(0, 4)}_DM_INST`.toUpperCase(),
      tenantId: `INST-BEACON-${timestamp.slice(0, 4)}`,
      status: 'active',
    });

    institutionEmpty = await Institution.create({
      name: `Crestview Institute ${timestamp}`,
      institutionCode: `C_${timestamp.slice(0, 4)}_DM_INST`.toUpperCase(),
      tenantId: `INST-CREST-${timestamp.slice(0, 4)}`,
      status: 'active',
    });

    // 2. Create Initial Departments
    departmentA1 = await Department.create({
      name: `Computer Engineering ${timestamp}`,
      code: `CE_${timestamp.slice(0, 4)}_DM_DEPT`.toUpperCase(),
      description: 'Department of Computer Engineering',
      institutionId: institutionA._id,
      status: 'active',
    });

    departmentA2 = await Department.create({
      name: `Electrical Engineering ${timestamp}`,
      code: `EE_${timestamp.slice(0, 4)}_DM_DEPT`.toUpperCase(),
      description: 'Department of Electrical Engineering',
      institutionId: institutionA._id,
      status: 'active',
    });

    archivedDeptA = await Department.create({
      name: `Civil Engineering ${timestamp}`,
      code: `CV_${timestamp.slice(0, 4)}_DM_DEPT`.toUpperCase(),
      description: 'Archived Civil Engineering',
      institutionId: institutionA._id,
      status: 'archived',
    });

    departmentB = await Department.create({
      name: `Business Administration ${timestamp}`,
      code: `BA_${timestamp.slice(0, 4)}_DM_DEPT`.toUpperCase(),
      description: 'Department of Business Admin at Beacon College',
      institutionId: institutionB._id,
      status: 'active',
    });

    // 3. Create Users
    // Platform Super Admin
    superAdmin = await User.create({
      name: 'Super Admin Test',
      email: `super_${timestamp}_deptmgmt_test@example.com`,
      password: 'Password123!',
      role: 'super_admin',
      roles: ['super_admin', 'user'],
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
    superAdminToken = generateToken(superAdmin);

    // Institution Admin for Institution A
    instAdminA = await User.create({
      name: 'Admin Apex',
      email: `admin_apex_${timestamp}_deptmgmt_test@example.com`,
      password: 'Password123!',
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institutionA._id,
      tenantId: institutionA.tenantId,
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
    instAdminAToken = generateToken(instAdminA);

    // Institution Admin for Institution B
    instAdminB = await User.create({
      name: 'Admin Beacon',
      email: `admin_beacon_${timestamp}_deptmgmt_test@example.com`,
      password: 'Password123!',
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institutionB._id,
      tenantId: institutionB.tenantId,
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
    instAdminBToken = generateToken(instAdminB);

    // Faculty members for Institution A
    facultyA1 = await User.create({
      name: 'Prof. Donald Knuth',
      email: `knuth_${timestamp}_deptmgmt_test@example.com`,
      password: 'Password123!',
      role: 'teacher',
      roles: ['teacher', 'user'],
      institutionId: institutionA._id,
      tenantId: institutionA.tenantId,
      departmentId: departmentA1._id,
      university: {
        college: institutionA.name,
        department: departmentA1.name,
      },
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });

    facultyA2 = await User.create({
      name: 'Prof. Claude Shannon',
      email: `shannon_${timestamp}_deptmgmt_test@example.com`,
      password: 'Password123!',
      role: 'teacher',
      roles: ['teacher', 'user'],
      institutionId: institutionA._id,
      tenantId: institutionA.tenantId,
      departmentId: null, // Unassigned initially
      university: {
        college: institutionA.name,
        department: '',
      },
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });

    // Faculty member for Institution B
    facultyB = await User.create({
      name: 'Prof. Ada Lovelace Beacon',
      email: `lovelace_b_${timestamp}_deptmgmt_test@example.com`,
      password: 'Password123!',
      role: 'teacher',
      roles: ['teacher', 'user'],
      institutionId: institutionB._id,
      tenantId: institutionB.tenantId,
      departmentId: departmentB._id,
      university: {
        college: institutionB.name,
        department: departmentB.name,
      },
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });

    // Student (Unauthorized role for admin operations)
    studentUser = await User.create({
      name: 'Student Tim',
      email: `student_${timestamp}_deptmgmt_test@example.com`,
      password: 'Password123!',
      role: 'user',
      roles: ['user'],
      institutionId: institutionA._id,
      tenantId: institutionA.tenantId,
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
    studentToken = generateToken(studentUser);
  });

  afterAll(async () => {
    await User.deleteMany({ email: /.*_deptmgmt_test@example\.com$/ });
    await Institution.deleteMany({ institutionCode: /.*_DM_INST$/ });
    await Department.deleteMany({ code: /.*_DM_DEPT$/ });
  });

  describe('1. Department Creation Permissions and Validation', () => {
    it('Institution Admin can add a new department for their institution', async () => {
      const res = await request(app)
        .post('/api/admin/departments')
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({
          name: `Robotics and AI ${timestamp}`,
          code: `RAI_${timestamp.slice(0, 3)}`.toUpperCase(),
          description: 'Center for Robotics and Intelligence',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(`Robotics and AI ${timestamp}`);
      expect(res.body.data.institutionId.toString()).toBe(institutionA._id.toString());
    });

    it('Duplicate department name within the same institution is rejected with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/admin/departments')
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({
          name: departmentA1.name, // existing department in inst A
          code: `DUP_${timestamp.slice(0, 3)}`.toUpperCase(),
          description: 'Duplicate department test',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('Empty department name is rejected with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/admin/departments')
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({
          name: '   ',
          code: 'EMPTY',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Department Deletion Security Restrictions', () => {
    it('Institution Admin CANNOT delete a department by directly calling the API (returns 403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/admin/departments/${departmentA2._id}`)
        .set('Authorization', `Bearer ${instAdminAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      // Verify the department still exists in database
      const deptCheck = await Department.findById(departmentA2._id);
      expect(deptCheck).not.toBeNull();
      expect(deptCheck._id.toString()).toBe(departmentA2._id.toString());
    });

    it('Platform Super Admin CAN delete a department', async () => {
      // Create a temporary department to delete
      const tempDept = await Department.create({
        name: `Temp Dept To Delete ${timestamp}`,
        code: `DEL_${timestamp.slice(0, 3)}`.toUpperCase(),
        institutionId: institutionA._id,
        status: 'active',
      });

      const res = await request(app)
        .delete(`/api/admin/departments/${tempDept._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deletedCheck = await Department.findById(tempDept._id);
      expect(deletedCheck).toBeNull();
    });
  });

  describe('3. Department Viewing and Empty State Scoping', () => {
    it('Institution Admin can view departments belonging to their institution only', async () => {
      const res = await request(app)
        .get('/api/admin/departments')
        .set('Authorization', `Bearer ${instAdminAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const deptNames = res.body.data.map((d) => d.name);
      expect(deptNames).toContain(departmentA1.name);
      // Must NOT include department belonging to Institution B
      expect(deptNames).not.toContain(departmentB.name);

      // Must not contain fake mock '_id: unassigned' entry
      const hasUnassignedMock = res.body.data.some((d) => d._id === 'unassigned' || d.id === 'unassigned');
      expect(hasUnassignedMock).toBe(false);
    });

    it('Institution Admin can edit department details (PUT /api/admin/departments/:id)', async () => {
      const updatedDesc = 'Updated description for Department of Computer Engineering';
      const res = await request(app)
        .put(`/api/admin/departments/${departmentA1._id}`)
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({
          description: updatedDesc,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe(updatedDesc);
    });

    it('Displays clear empty state data when an institution has no departments', async () => {
      // Create admin for the empty institution
      const instAdminEmpty = await User.create({
        name: 'Admin Empty Inst',
        email: `admin_empty_${timestamp}_deptmgmt_test@example.com`,
        password: 'Password123!',
        role: 'institution_admin',
        roles: ['institution_admin', 'user'],
        institutionId: institutionEmpty._id,
        tenantId: institutionEmpty.tenantId,
        accountStatus: 'ACTIVE',
        status: 'active',
        emailVerified: true,
      });
      const emptyAdminToken = generateToken(instAdminEmpty);

      const res = await request(app)
        .get('/api/admin/departments')
        .set('Authorization', `Bearer ${emptyAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.unassigned).toBeDefined();
    });
  });

  describe('4. Faculty Retrieval and Scoping', () => {
    it('Institution Admin can load faculty belonging to their institution', async () => {
      const res = await request(app)
        .get('/api/admin/users?role=teacher')
        .set('Authorization', `Bearer ${instAdminAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const returnedUsers = res.body.data.users;
      const returnedIds = returnedUsers.map((u) => u._id.toString());

      expect(returnedIds).toContain(facultyA1._id.toString());
      expect(returnedIds).toContain(facultyA2._id.toString());
      // Must NOT contain faculty from Institution B
      expect(returnedIds).not.toContain(facultyB._id.toString());
    });
  });

  describe('5. Faculty Assignment to Departments Workflow', () => {
    it('Institution Admin can assign a faculty member to a valid department', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${facultyA2._id}/department`)
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({
          departmentId: departmentA2._id,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.departmentId).toBeDefined();
      expect(res.body.data.user.departmentId._id.toString()).toBe(departmentA2._id.toString());
      expect(res.body.data.user.university.department).toBe(departmentA2.name);
    });

    it('Alternative alias endpoint POST /api/admin/faculty/assign-department works identically', async () => {
      const res = await request(app)
        .post('/api/admin/faculty/assign-department')
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({
          facultyId: facultyA2._id,
          departmentId: departmentA1._id,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.departmentId._id.toString()).toBe(departmentA1._id.toString());
      expect(res.body.data.user.university.department).toBe(departmentA1.name);
    });

    it('The assigned department persists after reload / refresh', async () => {
      // Re-fetch faculty from database
      const reloadedFaculty = await User.findById(facultyA2._id).populate('departmentId');
      expect(reloadedFaculty.departmentId).not.toBeNull();
      expect(reloadedFaculty.departmentId._id.toString()).toBe(departmentA1._id.toString());
      expect(reloadedFaculty.departmentId.name).toBe(departmentA1.name);

      // Re-fetch via admin API endpoint
      const res = await request(app)
        .get('/api/admin/users?role=teacher')
        .set('Authorization', `Bearer ${instAdminAToken}`);

      const foundFaculty = res.body.data.users.find((u) => u._id.toString() === facultyA2._id.toString());
      expect(foundFaculty).toBeDefined();
      expect(foundFaculty.departmentId).toBeDefined();
      expect(foundFaculty.departmentId._id.toString()).toBe(departmentA1._id.toString());
      expect(foundFaculty.departmentId.name).toBe(departmentA1.name);
    });

    it('Can unassign a faculty member department using null or empty string', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${facultyA2._id}/department`)
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({
          departmentId: null,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.departmentId).toBeNull();

      const refreshed = await User.findById(facultyA2._id);
      expect(refreshed.departmentId).toBeNull();
    });
  });

  describe('6. Security Boundaries and Cross-Institution Protections', () => {
    it('Faculty CANNOT be assigned to a department in another institution (returns 403 Forbidden)', async () => {
      // Admin A tries to assign faculty A1 to department B (which belongs to Institution B)
      const res = await request(app)
        .put(`/api/admin/users/${facultyA1._id}/department`)
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({
          departmentId: departmentB._id, // Department in Beacon College
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('CROSS_INSTITUTION_DEPARTMENT_DENIED');
    });

    it('Admin CANNOT assign faculty member belonging to another institution (returns 403 Forbidden)', async () => {
      // Admin A tries to assign faculty B (from Institution B) to department A1
      const res = await request(app)
        .put(`/api/admin/users/${facultyB._id}/department`)
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({
          departmentId: departmentA1._id,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('CROSS_INSTITUTION_ACCESS_DENIED');
    });

    it('An invalid department ID format is rejected with 400 Bad Request', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${facultyA1._id}/department`)
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({
          departmentId: 'invalid-non-object-id',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_DEPARTMENT_ID');
    });

    it('A non-existent department ObjectId is rejected with 404 Not Found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/admin/users/${facultyA1._id}/department`)
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({
          departmentId: nonExistentId,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('DEPARTMENT_NOT_FOUND');
    });

    it('Cannot assign faculty to an archived department (returns 400 Bad Request)', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${facultyA1._id}/department`)
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({
          departmentId: archivedDeptA._id,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('DEPARTMENT_ARCHIVED');
    });

    it('Unauthorized user (student) cannot assign faculty to a department (returns 403 Forbidden)', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${facultyA1._id}/department`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          departmentId: departmentA1._id,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Unauthenticated request without token is rejected with 401 Unauthorized', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${facultyA1._id}/department`)
        .send({
          departmentId: departmentA1._id,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
