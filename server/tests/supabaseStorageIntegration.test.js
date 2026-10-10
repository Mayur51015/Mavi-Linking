const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');

const User = require('../src/models/User');
const Institution = require('../src/models/Institution');
const Project = require('../src/models/Project');
const SharedDocument = require('../src/models/SharedDocument');
const {
  STORAGE_BUCKETS,
  validateFile,
  validateFileSignature,
  generateStoragePath,
} = require('../src/utils/fileValidation');
const {
  uploadFile,
  getSignedUrl,
  getPublicUrl,
  downloadFile,
  deleteFile,
  replaceFile,
  cleanupOrphan,
} = require('../src/services/supabaseStorageService');


jest.setTimeout(40000);

describe('EduTalentX — Supabase Storage Integration & File Validation Test Suite', () => {
  let app;
  let studentUser, studentToken;
  let otherStudentUser, otherStudentToken;
  let instAdminA, instAdminAToken;
  let instAdminB, instAdminBToken;
  let superAdmin, superAdminToken;
  let institutionA, institutionB;

  const timestamp = Date.now() + '_' + Math.random().toString(36).substring(7);

  // Valid File Buffers with correct magic bytes
  const validPngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
  const validJpgBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
  const validPdfBuffer = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF');
  const invalidBuffer = Buffer.from('Plain text fake file masquerading as an image or pdf');

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
    app.use('/api/auth', require('../src/routes/authRoutes'));
    app.use('/api/admin', require('../src/routes/adminRoutes'));
    app.use('/api/projects', require('../src/routes/projectRoutes'));
    app.use('/api/documents', require('../src/routes/documentRoutes'));
    app.use(require('../src/middleware/errorHandler'));

    // Create Test Institutions
    institutionA = await Institution.create({
      name: `Storage Test University A ${timestamp}`,
      code: `STUA_${timestamp}`,
      tenantId: `INST-STUA-${timestamp}`,
      domain: `stua_${timestamp}.edu`,
      status: 'active',
      licenseStatus: 'active',
    });

    institutionB = await Institution.create({
      name: `Storage Test University B ${timestamp}`,
      code: `STUB_${timestamp}`,
      tenantId: `INST-STUB-${timestamp}`,
      domain: `stub_${timestamp}.edu`,
      status: 'active',
      licenseStatus: 'active',
    });

    // Create Users
    studentUser = await User.create({
      name: 'Alice Student',
      email: `alice_${timestamp}@student.edu`,
      password: 'Password123!',
      role: 'user',
      roles: ['user'],
      institutionId: institutionA._id,
      tenantId: institutionA.tenantId,
      university: { name: institutionA.name },
      status: 'active',
      isVerified: true,
      emailVerified: true,
      approvalStatus: 'approved',
      accountStatus: 'ACTIVE',
    });
    studentToken = generateToken(studentUser);

    otherStudentUser = await User.create({
      name: 'Bob Student',
      email: `bob_${timestamp}@student.edu`,
      password: 'Password123!',
      role: 'user',
      roles: ['user'],
      institutionId: institutionB._id,
      tenantId: institutionB.tenantId,
      university: { name: institutionB.name },
      status: 'active',
      isVerified: true,
      emailVerified: true,
      approvalStatus: 'approved',
      accountStatus: 'ACTIVE',
    });
    otherStudentToken = generateToken(otherStudentUser);

    instAdminA = await User.create({
      name: 'Admin Inst A',
      email: `adminA_${timestamp}@stua.edu`,
      password: 'Password123!',
      role: 'institution_admin',
      roles: ['institution_admin'],
      institutionId: institutionA._id,
      tenantId: institutionA.tenantId,
      university: { name: institutionA.name },
      status: 'active',
      isVerified: true,
    });
    instAdminAToken = generateToken(instAdminA);

    instAdminB = await User.create({
      name: 'Admin Inst B',
      email: `adminB_${timestamp}@stub.edu`,
      password: 'Password123!',
      role: 'institution_admin',
      roles: ['institution_admin'],
      institutionId: institutionB._id,
      tenantId: institutionB.tenantId,
      university: { name: institutionB.name },
      status: 'active',
      isVerified: true,
    });
    instAdminBToken = generateToken(instAdminB);


    superAdmin = await User.create({
      name: 'Global Super Admin',
      email: `super_${timestamp}@edutalentx.internal`,
      password: 'Password123!',
      role: 'admin',
      roles: ['admin', 'super_admin'],
      status: 'active',
      isVerified: true,
    });
    superAdminToken = generateToken(superAdmin);
  });

  afterAll(async () => {
    await User.deleteMany({ email: new RegExp(timestamp) });
    await Institution.deleteMany({ _id: { $in: [institutionA._id, institutionB._id] } });
    await Project.deleteMany({ title: new RegExp(timestamp) });
    await SharedDocument.deleteMany({ title: new RegExp(timestamp) });
  });

  // ─── 1. FILE VALIDATION & SIGNATURE VERIFICATION ───────────────────────────
  describe('File Validation Unit Logic', () => {
    test('validates magic bytes for PNG, JPEG, and PDF', () => {
      expect(validateFileSignature(validPngBuffer, 'image/png', '.png')).toBe(true);
      expect(validateFileSignature(validJpgBuffer, 'image/jpeg', '.jpg')).toBe(true);
      expect(validateFileSignature(validPdfBuffer, 'application/pdf', '.pdf')).toBe(true);
    });

    test('rejects forged files with mismatched or invalid magic bytes', () => {
      expect(validateFileSignature(invalidBuffer, 'image/png', '.png')).toBe(false);
      expect(validateFileSignature(invalidBuffer, 'application/pdf', '.pdf')).toBe(false);
      expect(validateFileSignature(invalidBuffer, 'image/jpeg', '.jpeg')).toBe(false);
    });

    test('validates bucket size, MIME type, and extension restrictions', () => {
      const validFile = {
        originalname: 'avatar.png',
        mimetype: 'image/png',
        buffer: validPngBuffer,
        size: validPngBuffer.length,
      };
      const result = validateFile(validFile, STORAGE_BUCKETS.PROFILE_IMAGES);
      expect(result.valid).toBe(true);

      const invalidExtFile = {
        originalname: 'script.exe',
        mimetype: 'application/x-msdownload',
        buffer: Buffer.from('MZ1234567890'),
        size: 100,
      };
      const extResult = validateFile(invalidExtFile, STORAGE_BUCKETS.PROFILE_IMAGES);
      expect(extResult.valid).toBe(false);
      expect(extResult.message).toContain('Invalid file extension');

      const oversizedFile = {
        originalname: 'giant.png',
        mimetype: 'image/png',
        buffer: validPngBuffer,
        size: 15 * 1024 * 1024, // 15MB > 5MB limit
      };
      const sizeResult = validateFile(oversizedFile, STORAGE_BUCKETS.PROFILE_IMAGES);
      expect(sizeResult.valid).toBe(false);
      expect(sizeResult.message).toContain('exceeds maximum allowed size');
    });

    test('generates unpredictable non-guessable storage paths', () => {
      const path1 = generateStoragePath('avatars', 'user123', 'profile.png');
      const path2 = generateStoragePath('avatars', 'user123', 'profile.png');
      expect(path1).toMatch(/^avatars\/user123\/\d+_[a-f0-9]+\.png$/);
      expect(path2).toMatch(/^avatars\/user123\/\d+_[a-f0-9]+\.png$/);
      expect(path1).not.toBe(path2);
    });
  });

  // ─── 2. AVATAR UPLOAD (PROFILE-IMAGES BUCKET) ──────────────────────────────
  describe('Avatar Profile Picture Management (POST /api/auth/avatar)', () => {
    test('uploads valid avatar, stores in Supabase profile-images bucket, and updates User model', async () => {
      const res = await request(app)
        .post('/api/auth/avatar')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', validPngBuffer, 'avatar.png');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.avatar).toContain('storage/v1/object/public/profile-images');
      expect(res.body.data.user.avatarStoragePath).toMatch(/^avatars\//);

      const updatedUser = await User.findById(studentUser._id);
      expect(updatedUser.avatar).toBe(res.body.data.avatar);
      expect(updatedUser.avatarStoragePath).toBe(res.body.data.user.avatarStoragePath);
    });

    test('rejects forged avatar file with mismatched magic bytes', async () => {
      const res = await request(app)
        .post('/api/auth/avatar')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', invalidBuffer, 'forged.png');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('signature');
    });
  });

  // ─── 3. RESUME UPLOADS & SHORT-LIVED SIGNED URLS (RESUMES BUCKET) ───────────
  describe('Student Resume Document Management (POST /api/auth/document/resume)', () => {
    let uploadedResumePath = '';

    test('uploads resume to private resumes bucket with storagePath metadata', async () => {
      const res = await request(app)
        .post('/api/auth/document/resume')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Summer 2026 Resume')
        .attach('file', validPdfBuffer, 'resume.pdf');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedUser = await User.findById(studentUser._id);
      const resumeDoc = updatedUser.documents?.list?.find((d) => d.type === 'resume');
      expect(resumeDoc).toBeDefined();
      expect(resumeDoc.bucket).toBe(STORAGE_BUCKETS.RESUMES);
      expect(resumeDoc.storagePath).toMatch(/^resume\//);
      uploadedResumePath = resumeDoc.storagePath;
    });

    test('generates short-lived signed URL for authorized owner', async () => {
      const res = await request(app)
        .get('/api/auth/document/resume?signedUrl=true')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.signedUrl).toContain('storage/v1/object/sign/resumes');
    });

    test('downloads or redirects document buffer successfully', async () => {
      const res = await request(app)
        .get('/api/auth/document/resume?download=true')
        .set('Authorization', `Bearer ${studentToken}`);

      expect([200, 302]).toContain(res.status);
      if (res.status === 302) {
        expect(res.headers.location).toContain('resumes');
      }
    });
  });

  // ─── 4. CERTIFICATES CRUD (CERTIFICATES BUCKET) ────────────────────────────
  describe('Student Certificates Management (/api/auth/certificate)', () => {
    let certificateId = '';

    test('creates certificate with PDF attachment stored in certificates bucket', async () => {
      const res = await request(app)
        .post('/api/auth/certificate')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'AWS Certified Solutions Architect')
        .field('issuer', 'Amazon Web Services')
        .field('category', 'Technical')
        .attach('file', validPdfBuffer, 'aws_cert.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.certificate.bucket).toBe(STORAGE_BUCKETS.CERTIFICATES);
      expect(res.body.data.certificate.storagePath).toMatch(/^certificates\//);
      certificateId = res.body.data.certificate._id;
    });

    test('owner can access certificate file/signedUrl', async () => {
      const res = await request(app)
        .get(`/api/auth/certificate/${certificateId}/file?signedUrl=true`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.signedUrl).toContain('storage/v1/object/sign/certificates');
    });

    test('cross-user access denial: another user cannot access certificate file', async () => {
      const res = await request(app)
        .get(`/api/auth/certificate/${certificateId}/file`)
        .set('Authorization', `Bearer ${otherStudentToken}`);

      expect(res.status).toBe(404);
    });

    test('deletes certificate record and cleans up storage', async () => {
      const res = await request(app)
        .delete(`/api/auth/certificate/${certificateId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const userAfterDelete = await User.findById(studentUser._id);
      expect(userAfterDelete.certificates.some((c) => c._id.toString() === certificateId)).toBe(false);
    });
  });

  // ─── 5. INSTITUTION LOGO UPLOADS (INSTITUTION-LOGOS BUCKET) ─────────────────
  describe('Institution Official Logo Management (/api/admin/my-institution/logo)', () => {
    test('Institution Admin can upload logo to institution-logos bucket', async () => {
      const res = await request(app)
        .post('/api/admin/my-institution/logo')
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .attach('logo', validPngBuffer, 'college_logo.png');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.logo).toContain('storage/v1/object/public/institution-logos');
      expect(res.body.data.logoStoragePath).toMatch(/^logos\//);

      const updatedInst = await Institution.findById(institutionA._id);
      expect(updatedInst.logo).toBe(res.body.data.logo);
      expect(updatedInst.logoStoragePath).toBe(res.body.data.logoStoragePath);
    });

    test('rejects cross-institution logo update attempt by unauthorized admin', async () => {
      const res = await request(app)
        .post(`/api/admin/institutions/${institutionB._id}/logo`)
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .attach('logo', validPngBuffer, 'unauthorized_logo.png');

      // Admin A has institutionA scope; cannot access institutionB
      expect([403, 401]).toContain(res.status);
    });
  });

  // ─── 6. PROJECT SCREENSHOT UPLOADS (PROJECT-ASSETS BUCKET) ──────────────────
  describe('Project Screenshot Management (/api/projects/:id/screenshot)', () => {
    let testProject;

    beforeAll(async () => {
      testProject = await Project.create({
        user: studentUser._id,
        title: `NextGen AI Portal ${timestamp}`,
        description: 'An AI-powered web platform with comprehensive analytics and insights.',
        technologies: ['React', 'Node.js', 'MongoDB'],
      });
    });

    test('project owner can upload screenshot to project-assets bucket', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProject._id}/screenshot`)
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('screenshot', validPngBuffer, 'screenshot.png');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.screenshot).toContain('storage/v1/object/public/project-assets');
      expect(res.body.data.storagePath).toMatch(/^projects\//);

      const updatedProj = await Project.findById(testProject._id);
      expect(updatedProj.screenshot).toBe(res.body.data.screenshot);
      expect(updatedProj.storagePath).toBe(res.body.data.storagePath);
    });

    test('unauthorized non-owner cannot upload screenshot to another user project', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProject._id}/screenshot`)
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .attach('screenshot', validPngBuffer, 'hack.png');

      expect(res.status).toBe(403);
    });

    test('deleting project removes record and cleans up storagePath', async () => {
      const res = await request(app)
        .delete(`/api/projects/${testProject._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      const projAfter = await Project.findById(testProject._id);
      expect(projAfter).toBeNull();
    });
  });

  // ─── 7. SHARED ADMINISTRATIVE DOCUMENTS (INSTITUTION-DOCUMENTS BUCKET) ─────
  describe('Shared Institution Documents (/api/documents)', () => {
    let documentId = '';

    test('faculty/admin uploads document to institution-documents bucket', async () => {
      const res = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .field('title', `Syllabus Guidelines ${timestamp}`)
        .field('description', 'Official curriculum guidelines')
        .attach('file', validPdfBuffer, 'guidelines.pdf');

      expect([201, 202]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bucket).toBe(STORAGE_BUCKETS.INSTITUTION_DOCUMENTS);

      expect(res.body.data.storagePath).toMatch(/^shared-docs\//);
      documentId = res.body.data._id;
    });

    test('user in different institution is denied access to shared document', async () => {
      const res = await request(app)
        .get(`/api/documents/${documentId}/download`)
        .set('Authorization', `Bearer ${otherStudentToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── 8. ORPHAN ROLLBACK SIMULATION ─────────────────────────────────────────
  describe('Orphan Rollback Resilience', () => {
    test('cleanupOrphan gracefully rolls back uploaded object without throwing unhandled rejection', async () => {
      await expect(
        cleanupOrphan({
          bucket: STORAGE_BUCKETS.PROFILE_IMAGES,
          objectPath: 'avatars/test/nonexistent.png',
        })
      ).resolves.not.toThrow();
    });
  });
});
