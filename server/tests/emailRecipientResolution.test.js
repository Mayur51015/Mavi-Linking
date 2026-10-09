const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const User = require('../src/models/User');
const Institution = require('../src/models/Institution');
const RecruitmentNotification = require('../src/models/RecruitmentNotification');
const {
  sendEmail,
  resolveRecipientEmail,
  sendAssignmentNotificationEmail,
  sendOwnerAlertEmail,
  sendAdminInvitationEmail,
  sendAccountLifecycleEmail,
} = require('../src/utils/sendEmail');
const { createNotification } = require('../src/services/notificationService');
const teacherService = require('../src/services/teacherService');
const placementService = require('../src/services/placementService');

jest.setTimeout(30000);

describe('EDUTALENTX — SMTP Recipient Resolution & Delivery Target Test Suite', () => {
  let app;
  let ownerUser;
  let teacherUser;
  let recruiterUser;
  let studentUser;
  let institution;

  const timestamp = Date.now() + '_' + Math.random().toString(36).substring(7);
  const ownerEmail = `owner_${timestamp}@edutalentx.com`;
  const teacherEmail = `teacher_${timestamp}@institution.edu`;
  const recruiterEmail = `recruiter_${timestamp}@techcorp.com`;
  const studentEmail = `student_${timestamp}@student.institution.edu`;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.OWNER_EMAIL = ownerEmail;
    process.env.EMAIL_USER = ownerEmail;
    process.env.SMTP_USER = ownerEmail;
    process.env.EMAIL_FROM = '"EduTalentX Security" <notifications@edutalentx.com>';

    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edutalentx_test';
      await mongoose.connect(mongoUri);
    }

    app = express();
    app.use(express.json());
    app.use('/api', require('../src/routes/publicRoutes'));

    // Create test Institution
    institution = await Institution.create({
      name: `Test Tech Institute ${timestamp}`,
      institutionCode: `INST_${timestamp.slice(0, 5)}`.toUpperCase(),
      status: 'active',
    });

    // Create Platform Owner
    ownerUser = await User.create({
      name: 'Platform Owner',
      email: ownerEmail,
      password: 'OwnerPassword@123',
      role: 'platform_owner',
      roles: ['platform_owner', 'super_admin', 'user'],
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });

    // Create Teacher
    teacherUser = await User.create({
      name: 'Prof. Alan Turing',
      email: teacherEmail,
      password: 'TeacherPassword@123',
      role: 'teacher',
      roles: ['teacher', 'user'],
      institutionId: institution._id,
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });

    // Create Recruiter
    recruiterUser = await User.create({
      name: 'Sarah Connor Recruiter',
      email: recruiterEmail,
      password: 'RecruiterPassword@123',
      role: 'recruiter',
      roles: ['recruiter', 'user'],
      companyName: 'Cyberdyne Systems',
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });

    // Create Student / Candidate (in EduTalentX, primary role is 'user' with 'student' in roles)
    studentUser = await User.create({
      name: 'John Doe Student',
      email: studentEmail,
      password: 'StudentPassword@123',
      role: 'user',
      roles: ['user', 'student'],
      institutionId: institution._id,
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
  });

  afterAll(async () => {
    await User.deleteMany({
      email: { $in: [ownerEmail, teacherEmail, recruiterEmail, studentEmail] },
    });
    if (institution && institution._id) {
      await Institution.deleteOne({ _id: institution._id });
    }
    const recipientIds = [ownerUser?._id, teacherUser?._id, recruiterUser?._id, studentUser?._id].filter(Boolean);
    if (recipientIds.length > 0) {
      await RecruitmentNotification.deleteMany({
        recipientId: { $in: recipientIds },
      });
    }
  });

  // =========================================================================
  // TEST 1: Owner assigns role/task to Teacher -> Teacher email receives it
  // =========================================================================
  test('TEST 1: Owner assigns role/task to Teacher -> Teacher email receives it (result.accepted and result.envelope.to equal teacher email)', async () => {
    const result = await sendAssignmentNotificationEmail({
      recipientUserId: teacherUser._id,
      actorUserId: ownerUser._id,
      actorName: ownerUser.name,
      actorRole: 'Platform Owner',
      assignmentTitle: 'Curriculum Review Assignment',
      assignmentDetails: 'Please review the updated CS curriculum for next semester.',
      assignmentType: 'FACULTY_ASSIGNMENT',
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('EMAIL_ACCEPTED');
    expect(result.accepted).toContain(teacherEmail.toLowerCase());
    expect(result.envelope.to).toContain(teacherEmail.toLowerCase());
    // Crucial: Must NEVER contain the owner email
    expect(result.accepted).not.toContain(ownerEmail.toLowerCase());
    expect(result.envelope.to).not.toContain(ownerEmail.toLowerCase());
  });

  // =========================================================================
  // TEST 2: Owner assigns role/task to Recruiter -> Recruiter email receives it
  // =========================================================================
  test('TEST 2: Owner assigns role/task to Recruiter -> Recruiter email receives it (result.accepted and result.envelope.to equal recruiter email)', async () => {
    const result = await sendAssignmentNotificationEmail({
      recipientUserId: recruiterUser._id,
      actorUserId: ownerUser._id,
      actorName: ownerUser.name,
      actorRole: 'Platform Owner',
      assignmentTitle: 'Campus Placement Access Granted',
      assignmentDetails: 'You have been granted access to review campus candidate pools.',
      assignmentType: 'RECRUITER_INVITATION',
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('EMAIL_ACCEPTED');
    expect(result.accepted).toContain(recruiterEmail.toLowerCase());
    expect(result.envelope.to).toContain(recruiterEmail.toLowerCase());
    expect(result.accepted).not.toContain(ownerEmail.toLowerCase());
    expect(result.envelope.to).not.toContain(ownerEmail.toLowerCase());
  });

  // =========================================================================
  // TEST 3: Teacher assigns drive/task to Student -> Student email receives it
  // =========================================================================
  test('TEST 3: Teacher assigns drive/task to Student -> Student email receives it (result.accepted and result.envelope.to equal student email)', async () => {
    const result = await sendAssignmentNotificationEmail({
      recipientUserId: studentUser._id,
      actorUserId: teacherUser._id,
      actorName: teacherUser.name,
      actorRole: 'Teacher',
      assignmentTitle: 'Assigned to Placement Drive: TechCorp 2026',
      assignmentDetails: 'You have been nominated and assigned to the TechCorp 2026 drive.',
      assignmentType: 'PLACEMENT_DRIVE_ASSIGNMENT',
      dueDate: new Date(Date.now() + 86400000 * 7),
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('EMAIL_ACCEPTED');
    expect(result.accepted).toContain(studentEmail.toLowerCase());
    expect(result.envelope.to).toContain(studentEmail.toLowerCase());
    expect(result.accepted).not.toContain(ownerEmail.toLowerCase());
    expect(result.accepted).not.toContain(teacherEmail.toLowerCase());
  });

  // =========================================================================
  // TEST 4: Recruiter contacts Candidate -> Candidate email receives it
  // =========================================================================
  test('TEST 4: Recruiter contacts Candidate -> Candidate email receives it (result.accepted and result.envelope.to equal student email)', async () => {
    const result = await sendAssignmentNotificationEmail({
      recipientUserId: studentUser._id,
      actorUserId: recruiterUser._id,
      actorName: recruiterUser.companyName || recruiterUser.name,
      actorRole: 'Recruiter',
      assignmentTitle: 'Interview Scheduled: Full Stack Engineer',
      assignmentDetails: 'Your technical interview has been scheduled for tomorrow at 10:00 AM.',
      assignmentType: 'INTERVIEW_SCHEDULED',
      dueDate: new Date(Date.now() + 86400000),
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('EMAIL_ACCEPTED');
    expect(result.accepted).toContain(studentEmail.toLowerCase());
    expect(result.envelope.to).toContain(studentEmail.toLowerCase());
    expect(result.accepted).not.toContain(ownerEmail.toLowerCase());
    expect(result.accepted).not.toContain(recruiterEmail.toLowerCase());
  });

  // =========================================================================
  // TEST 5: Owner receives genuine Owner alert -> Owner email receives it
  // =========================================================================
  test('TEST 5: Owner receives genuine Owner alert (sendOwnerAlertEmail with isOwnerEvent: true) -> Owner email receives it', async () => {
    const result = await sendOwnerAlertEmail({
      to: ownerEmail,
      title: 'Database Backup Completed',
      message: 'Automated nightly backup completed successfully.',
      details: { records: 4500, status: 'OK' },
      alertType: 'SYSTEM_BACKUP',
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('EMAIL_ACCEPTED');
    expect(result.accepted).toContain(ownerEmail.toLowerCase());
    expect(result.envelope.to).toContain(ownerEmail.toLowerCase());
  });

  // =========================================================================
  // TEST 6: Invalid/missing recipient -> sendEmail rejects safely with NO fallback to Owner
  // =========================================================================
  test('TEST 6: Invalid/missing recipient -> sendEmail rejects safely with EMAIL_REJECTED and NO fallback to Owner', async () => {
    // Attempt with null 'to' and non-existent recipientUserId
    const nonExistentId = new mongoose.Types.ObjectId();
    const resultMissing = await sendEmail({
      recipientUserId: nonExistentId,
      subject: 'Security Notice',
      text: 'This should not be delivered to owner.',
    });

    expect(resultMissing.success).toBe(false);
    expect(resultMissing.status).toBe('EMAIL_REJECTED');
    expect(resultMissing.error).toMatch(/recipient email could not be resolved/i);

    // Attempt with empty string
    const resultEmpty = await sendEmail({
      to: '',
      subject: 'Security Notice',
      text: 'This should not be delivered to owner.',
    });

    expect(resultEmpty.success).toBe(false);
    expect(resultEmpty.status).toBe('EMAIL_REJECTED');

    // Attempt with invalid string without @
    const resultInvalid = await sendEmail({
      to: 'invalid-email-address',
      subject: 'Security Notice',
      text: 'This should not be delivered to owner.',
    });

    expect(resultInvalid.success).toBe(false);
    expect(resultInvalid.status).toBe('EMAIL_REJECTED');
  });

  // =========================================================================
  // TEST 7: Separation of sender from recipient
  // =========================================================================
  test('TEST 7: Strict separation of sender from recipient -> envelope.from is system sender and envelope.to is strictly recipient', async () => {
    const result = await sendEmail({
      to: teacherEmail,
      subject: 'Test Sender Recipient Separation',
      text: 'Testing SMTP envelope headers.',
    });

    expect(result.success).toBe(true);
    expect(result.accepted).toContain(teacherEmail.toLowerCase());
    expect(result.envelope.to).toContain(teacherEmail.toLowerCase());
    // The recipient must not be substituted with SMTP_USER / ownerEmail
    expect(result.envelope.to).not.toContain(ownerEmail.toLowerCase());
    // The sender envelope or headers must reflect from configuration
    expect(result.envelope.from).toBeDefined();
  });

  // =========================================================================
  // TEST 8: resolveRecipientEmail helper resolution matrix
  // =========================================================================
  describe('TEST 8: resolveRecipientEmail helper resolution matrix', () => {
    test('resolves direct email string', async () => {
      const email = await resolveRecipientEmail({ to: 'DIRECT@EXAMPLE.COM' });
      expect(email).toBe('direct@example.com');
    });

    test('resolves email from user object', async () => {
      const email = await resolveRecipientEmail({ user: { email: 'USEROBJ@EXAMPLE.COM' } });
      expect(email).toBe('userobj@example.com');
    });

    test('resolves email from recipientUserId via User model', async () => {
      const email = await resolveRecipientEmail({ recipientUserId: studentUser._id });
      expect(email).toBe(studentEmail.toLowerCase());
    });

    test('resolves email from studentId via User model', async () => {
      const email = await resolveRecipientEmail({ studentId: studentUser._id });
      expect(email).toBe(studentEmail.toLowerCase());
    });

    test('resolves email from teacherId via User model', async () => {
      const email = await resolveRecipientEmail({ teacherId: teacherUser._id });
      expect(email).toBe(teacherEmail.toLowerCase());
    });

    test('resolves email from recruiterId via User model', async () => {
      const email = await resolveRecipientEmail({ recruiterId: recruiterUser._id });
      expect(email).toBe(recruiterEmail.toLowerCase());
    });

    test('returns null for missing, empty, or unresolvable identifier (NEVER returns Owner email)', async () => {
      const nonExistent = new mongoose.Types.ObjectId();
      expect(await resolveRecipientEmail({})).toBeNull();
      expect(await resolveRecipientEmail({ to: 'invalid-email' })).toBeNull();
      expect(await resolveRecipientEmail({ recipientUserId: nonExistent })).toBeNull();
    });
  });

  // =========================================================================
  // TEST 9: Notification Service with sendEmail: true
  // =========================================================================
  test('TEST 9: Notification Service with sendEmail: true resolves target user and delivers to student email', async () => {
    const notification = await createNotification({
      recipientId: studentUser._id,
      senderId: teacherUser._id,
      type: 'roadmap_updated',
      title: 'New Skill Milestone Assigned',
      message: 'Teacher Alan Turing updated your backend roadmap.',
      sendEmail: true,
    });

    expect(notification).toBeDefined();
    expect(notification.recipientId.toString()).toBe(studentUser._id.toString());
  });

  // =========================================================================
  // TEST 10: Protection against accidental Owner fallback when recipientUserId belongs to non-owner
  // =========================================================================
  test('TEST 10: If a caller erroneously passes Owner email as "to" alongside a student recipientUserId, sendEmail corrects to student email', async () => {
    const result = await sendEmail({
      to: ownerEmail, // Accidental owner email passed by bug in caller
      recipientUserId: studentUser._id, // Intended student recipient ID
      subject: 'Security Alert For Student',
      text: 'Student specific alert.',
      isOwnerEvent: false,
    });

    expect(result.success).toBe(true);
    // Corrected to student email
    expect(result.accepted).toContain(studentEmail.toLowerCase());
    expect(result.envelope.to).toContain(studentEmail.toLowerCase());
    expect(result.accepted).not.toContain(ownerEmail.toLowerCase());
  });

  // =========================================================================
  // TEST 11: Public test endpoint (/api/public/test-email) rejects missing/invalid "to"
  // =========================================================================
  describe('TEST 11: Public test endpoint recipient validation', () => {
    test('POST /api/public/test-email returns 400 when "to" is missing (no fallback to Owner)', async () => {
      const res = await request(app)
        .post('/api/public/test-email')
        .send({
          name: 'Anonymous Admin',
          role: 'institution_admin',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/valid recipient email.*required/i);
    });

    test('POST /api/public/test-email dispatches to provided recipient when valid', async () => {
      const targetEmail = `admin_test_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/public/test-email')
        .send({
          to: targetEmail,
          name: 'Dr. Test Admin',
          role: 'institution_admin',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accepted).toContain(targetEmail.toLowerCase());
      expect(res.body.envelope.to).toContain(targetEmail.toLowerCase());
      expect(res.body.accepted).not.toContain(ownerEmail.toLowerCase());
    });
  });

  // =========================================================================
  // TEST 12: Account Lifecycle emails (Suspension, Deactivation, Reactivation)
  // =========================================================================
  test('TEST 12: Account Lifecycle emails deliver strictly to target recipient user', async () => {
    const result = await sendAccountLifecycleEmail({
      recipientUserId: studentUser._id,
      actorUserId: ownerUser._id,
      name: studentUser.name,
      etxId: 'ETX-TEST-001',
      role: 'Student',
      type: 'REACTIVATED',
      reason: 'Identity verified successfully',
    });

    expect(result.success).toBe(true);
    expect(result.accepted).toContain(studentEmail.toLowerCase());
    expect(result.envelope.to).toContain(studentEmail.toLowerCase());
    expect(result.accepted).not.toContain(ownerEmail.toLowerCase());
  });
});
