const mongoose = require('mongoose');
const User = require('../src/models/User');
const Institution = require('../src/models/Institution');
const {
  sendEmail,
  resolveRecipientEmail,
  getSmtpConfig,
  validateSmtpConfig,
  verifySmtpConnection,
  maskEmail,
  generatePasswordResetEmailHtml,
  generateAdminInvitationEmailHtml,
  generateStudentVerificationEmailHtml,
  generateEmailChangeOtpEmailHtml,
  generateAccountLifecycleEmailHtml,
  sendAssignmentNotificationEmail,
  sendAdminInvitationEmail,
} = require('../src/utils/sendEmail');

jest.setTimeout(30000);

describe('EDUTALENTX — Nodemailer + Brevo SMTP Unit & Integration Test Suite', () => {
  let studentUser;
  let teacherUser;
  let adminUser;
  let institution;

  const testStamp = Date.now() + '_' + Math.random().toString(36).substring(7);
  const ownerEmail = `platform_owner_${testStamp}@edutalentx.com`;
  const studentEmail = `student_${testStamp}@testinst.edu`;
  const teacherEmail = `teacher_${testStamp}@testinst.edu`;
  const adminEmail = `admin_${testStamp}@testinst.edu`;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.OWNER_EMAIL = ownerEmail;
    process.env.SMTP_USER = 'brevo_login@edutalentx.com';
    process.env.SMTP_PASS = 'xsmtpsib-testkey1234567890';
    process.env.SMTP_HOST = 'smtp-relay.brevo.com';
    process.env.SMTP_PORT = '587';
    process.env.MAIL_FROM = '"EduTalentX Security" <security@edutalentx.com>';

    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edutalentx_test';
      await mongoose.connect(mongoUri);
    }

    institution = await Institution.create({
      name: `Brevo Test Institute ${testStamp}`,
      institutionCode: `BTI_${testStamp.slice(0, 5)}`.toUpperCase(),
      status: 'active',
    });

    studentUser = await User.create({
      name: 'Test Student',
      email: studentEmail,
      password: 'HashedPassword123!',
      role: 'user',
      roles: ['user', 'student'],
      institutionId: institution._id,
      status: 'active',
      accountStatus: 'ACTIVE',
      emailVerified: true,
    });

    teacherUser = await User.create({
      name: 'Test Teacher',
      email: teacherEmail,
      password: 'HashedPassword123!',
      role: 'teacher',
      roles: ['teacher', 'user'],
      institutionId: institution._id,
      status: 'active',
      accountStatus: 'ACTIVE',
      emailVerified: true,
    });

    adminUser = await User.create({
      name: 'Test Admin',
      email: adminEmail,
      password: 'HashedPassword123!',
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institution._id,
      status: 'active',
      accountStatus: 'ACTIVE',
      emailVerified: true,
    });
  });

  afterAll(async () => {
    try {
      await User.deleteMany({
        email: { $in: [studentEmail, teacherEmail, adminEmail, ownerEmail] },
      });
      if (institution?._id) {
        await Institution.findByIdAndDelete(institution._id);
      }
    } catch (_) {}
  });

  describe('1. Brevo SMTP Configuration & Validation', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('defaults host to smtp-relay.brevo.com and port to 587', () => {
      delete process.env.SMTP_HOST;
      delete process.env.EMAIL_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.EMAIL_PORT;

      const config = getSmtpConfig();
      expect(config.host).toBe('smtp-relay.brevo.com');
      expect(config.port).toBe(587);
    });

    it('reads SMTP_USER, SMTP_PASS, and MAIL_FROM correctly', () => {
      process.env.SMTP_HOST = 'smtp-relay.brevo.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'brevo_account@example.com';
      process.env.SMTP_PASS = 'xsmtpsib-secret123';
      process.env.MAIL_FROM = '"EduTalentX" <noreply@example.com>';

      const config = getSmtpConfig();
      expect(config.host).toBe('smtp-relay.brevo.com');
      expect(config.port).toBe(587);
      expect(config.user).toBe('brevo_account@example.com');
      expect(config.pass).toBe('xsmtpsib-secret123');
      expect(config.configuredFrom).toBe('"EduTalentX" <noreply@example.com>');
    });

    it('falls back to EMAIL_* legacy environment variables when SMTP_* not set', () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      delete process.env.MAIL_FROM;

      process.env.EMAIL_HOST = 'smtp-relay.brevo.com';
      process.env.EMAIL_PORT = '587';
      process.env.EMAIL_USER = 'legacy_brevo@example.com';
      process.env.EMAIL_PASS = 'xsmtpsib-legacy123';
      process.env.EMAIL_FROM = '"Legacy EduTalentX" <legacy@example.com>';

      const config = getSmtpConfig();
      expect(config.host).toBe('smtp-relay.brevo.com');
      expect(config.port).toBe(587);
      expect(config.user).toBe('legacy_brevo@example.com');
      expect(config.pass).toBe('xsmtpsib-legacy123');
      expect(config.configuredFrom).toBe('"Legacy EduTalentX" <legacy@example.com>');
    });

    it('validates required configuration and reports missing credentials without leaking secrets', () => {
      delete process.env.SMTP_USER;
      delete process.env.EMAIL_USER;
      delete process.env.SMTP_PASS;
      delete process.env.EMAIL_PASS;

      const result = validateSmtpConfig();
      expect(result.isValid).toBe(false);
      expect(result.missing).toContain('SMTP_USER');
      expect(result.missing).toContain('SMTP_PASS');
      expect(result.error).toMatch(/Missing required Brevo SMTP configuration/i);
      expect(result.error).not.toMatch(/password/i);
    });

    it('returns isValid: true when credentials are provided', () => {
      process.env.SMTP_USER = 'brevo_user@example.com';
      process.env.SMTP_PASS = 'xsmtpsib-some-key';

      const result = validateSmtpConfig();
      expect(result.isValid).toBe(true);
      expect(result.config.user).toBe('brevo_user@example.com');
    });

    it('masks email addresses properly for sanitized logging', () => {
      expect(maskEmail('mayur2006khandare@gmail.com')).toBe('m****e@gmail.com');
      expect(maskEmail('ab@test.com')).toBe('a*@test.com');
      expect(maskEmail('invalid-string')).toBe('invalid-recipient');
      expect(maskEmail(null)).toBe('invalid-recipient');
    });
  });

  describe('2. Delivery via Mocked SMTP Transporter', () => {
    it('successfully delivers email via mocked Nodemailer transporter', async () => {
      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValue({
          messageId: '<test-message-123@smtp-relay.brevo.com>',
          accepted: [studentEmail],
          rejected: [],
          response: '250 2.0.0 OK: queued as 1234567890',
          envelope: { from: 'security@edutalentx.com', to: [studentEmail] },
        }),
      };

      const result = await sendEmail({
        to: studentEmail,
        subject: 'EduTalentX — Welcome to Brevo Delivery',
        html: '<p>Welcome to EduTalentX via Brevo SMTP</p>',
        templateName: 'student-welcome',
        transporter: mockTransporter,
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe(studentEmail);
      expect(callArgs.subject).toBe('EduTalentX — Welcome to Brevo Delivery');
      expect(callArgs.html).toContain('Welcome to EduTalentX via Brevo SMTP');

      expect(result.success).toBe(true);
      expect(result.status).toBe('EMAIL_ACCEPTED');
      expect(result.messageId).toBe('<test-message-123@smtp-relay.brevo.com>');
      expect(result.accepted).toEqual([studentEmail]);
      expect(result.rejected).toEqual([]);
      expect(result.response).toContain('250 2.0.0 OK');
    });

    it('handles recipient rejection from SMTP relay gracefully', async () => {
      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValue({
          messageId: '<rejected-id-123@smtp-relay.brevo.com>',
          accepted: [],
          rejected: ['bounced@nonexistent-domain.xyz'],
          response: '550 5.1.1 User unknown',
          envelope: { from: 'security@edutalentx.com', to: ['bounced@nonexistent-domain.xyz'] },
        }),
      };

      const result = await sendEmail({
        to: 'bounced@nonexistent-domain.xyz',
        subject: 'Test Bounce',
        html: '<p>Test</p>',
        transporter: mockTransporter,
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('EMAIL_REJECTED');
      expect(result.rejected).toEqual(['bounced@nonexistent-domain.xyz']);
      expect(result.error).toMatch(/rejected by/i);
    });
  });

  describe('3. SMTP Authentication and Connection Failures', () => {
    it('captures EAUTH / 535 error and returns sanitized EMAIL_AUTH_ERROR without leaking secrets', async () => {
      const authError = new Error('Invalid login or password');
      authError.code = 'EAUTH';
      authError.responseCode = 535;

      const mockTransporter = {
        sendMail: jest.fn().mockRejectedValue(authError),
      };

      const result = await sendEmail({
        to: studentEmail,
        subject: 'Test Auth Failure',
        html: '<p>Test</p>',
        transporter: mockTransporter,
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('EMAIL_AUTH_ERROR');
      expect(result.error).toMatch(/Brevo SMTP authentication failed/i);
      expect(result.error).not.toMatch(/password/i);
    });

    it('captures connection timeout (ETIMEDOUT) and returns EMAIL_CONNECTION_ERROR', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.code = 'ETIMEDOUT';

      const mockTransporter = {
        sendMail: jest.fn().mockRejectedValue(timeoutError),
      };

      const result = await sendEmail({
        to: studentEmail,
        subject: 'Test Timeout',
        html: '<p>Test</p>',
        transporter: mockTransporter,
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('EMAIL_CONNECTION_ERROR');
      expect(result.error).toMatch(/timeout/i);
    });

    it('captures connection refused (ECONNREFUSED) and returns EMAIL_CONNECTION_REFUSED', async () => {
      const connError = new Error('connect ECONNREFUSED 127.0.0.1:587');
      connError.code = 'ECONNREFUSED';

      const mockTransporter = {
        sendMail: jest.fn().mockRejectedValue(connError),
      };

      const result = await sendEmail({
        to: studentEmail,
        subject: 'Test Conn Refused',
        html: '<p>Test</p>',
        transporter: mockTransporter,
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('EMAIL_CONNECTION_REFUSED');
      expect(result.error).toMatch(/Connection refused/i);
    });
  });

  describe('4. Recipient Isolation & No Owner Fallback', () => {
    it('rejects sending when recipient address is missing or invalid', async () => {
      const mockTransporter = {
        sendMail: jest.fn(),
      };

      const result = await sendEmail({
        to: 'invalid-email-without-at',
        subject: 'Invalid Recipient Test',
        html: '<p>Test</p>',
        transporter: mockTransporter,
      });

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.status).toBe('EMAIL_REJECTED');
      expect(result.code).toBe('MISSING_RECIPIENT');
    });

    it('never falls back to OWNER_EMAIL when target user email is missing', async () => {
      const mockTransporter = {
        sendMail: jest.fn(),
      };

      const result = await sendEmail({
        to: '',
        userId: new mongoose.Types.ObjectId(), // non-existent user
        subject: 'Target User Non-existent',
        html: '<p>Test</p>',
        transporter: mockTransporter,
      });

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.code).toBe('MISSING_RECIPIENT');
    });

    it('resolves recipient correctly by role from User model', async () => {
      const studentResolved = await resolveRecipientEmail({ studentId: studentUser._id });
      expect(studentResolved).toBe(studentEmail.toLowerCase());

      const teacherResolved = await resolveRecipientEmail({ teacherId: teacherUser._id });
      expect(teacherResolved).toBe(teacherEmail.toLowerCase());

      const adminResolved = await resolveRecipientEmail({ userId: adminUser._id });
      expect(adminResolved).toBe(adminEmail.toLowerCase());
    });
  });

  describe('5. Transactional Email Workflows & Templates', () => {
    it('preserves 10-minute expiry in Student Verification link and OTP email templates', () => {
      const verificationLink = 'https://edutalentx.com/verify-email?token=test_student_tok_123';
      const linkHtml = generateStudentVerificationEmailHtml({
        name: 'Alex Student',
        verificationLink,
      });

      expect(linkHtml).toContain('Alex Student');
      expect(linkHtml).toContain(verificationLink);
      expect(linkHtml).toContain('10 minutes');
      expect(linkHtml).toContain('EduTalentX');

      const otpHtml = generateEmailChangeOtpEmailHtml({
        name: 'Alex Student',
        otp: '482910',
        newEmail: 'alex.new@institution.edu',
      });

      expect(otpHtml).toContain('482910');
      expect(otpHtml).toContain('10 minutes');
      expect(otpHtml).toContain('alex.new@institution.edu');
    });

    it('preserves password reset token and security instructions in password reset template', () => {
      const resetLink = 'https://edutalentx.com/reset-password?token=mock_reset_token_999';
      const html = generatePasswordResetEmailHtml({
        name: 'Jane Admin',
        otp: '918273',
        resetLink,
      });

      expect(html).toContain('Jane Admin');
      expect(html).toContain('918273');
      expect(html).toContain(resetLink);
      expect(html).toContain('10 minutes');
      expect(html).toContain('Reset My Password');
    });

    it('preserves invitation parameters in admin invitation template', () => {
      const inviteLink = 'https://edutalentx.com/admin/accept-invite?token=invite_tok_555';
      const html = generateAdminInvitationEmailHtml({
        name: 'Professor Smith',
        role: 'department_admin',
        institutionName: 'Global Tech University',
        departmentName: 'Computer Science & Engineering',
        invitationLink: inviteLink,
        expiresHours: 48,
      });

      expect(html).toContain('Professor Smith');
      expect(html).toContain(inviteLink);
      expect(html).toContain('Global Tech University');
      expect(html).toContain('Computer Science & Engineering');
      expect(html).toContain('10 minutes');
    });

    it('dispatches admin invitation via sendAdminInvitationEmail through mock transporter', async () => {
      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValue({
          messageId: '<invite-sent-777@smtp-relay.brevo.com>',
          accepted: [adminEmail],
          rejected: [],
          response: '250 2.0.0 OK: invitation queued',
          envelope: { from: 'security@edutalentx.com', to: [adminEmail] },
        }),
      };

      const result = await sendAdminInvitationEmail({
        to: adminEmail,
        name: 'Test Administrator',
        role: 'institution_admin',
        institutionName: 'Brevo Test Institute',
        invitationLink: 'https://edutalentx.com/admin/accept-invite?token=abc',
        expiresHours: 48,
        transporter: mockTransporter,
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.status).toBe('EMAIL_ACCEPTED');
      expect(result.accepted).toContain(adminEmail);
    });

    it('dispatches assignment notification email via sendAssignmentNotificationEmail with resolved student ID', async () => {
      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValue({
          messageId: '<assign-sent-888@smtp-relay.brevo.com>',
          accepted: [studentEmail],
          rejected: [],
          response: '250 2.0.0 OK: assignment notification queued',
          envelope: { from: 'security@edutalentx.com', to: [studentEmail] },
        }),
      };

      const result = await sendAssignmentNotificationEmail({
        studentId: studentUser._id,
        assignmentTitle: 'Algorithms & Data Structures Lab 3',
        courseName: 'CS301 Advanced Data Structures',
        dueDate: '2026-10-25',
        transporter: mockTransporter,
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.to).toBe(studentEmail.toLowerCase());
      expect(call.subject).toContain('Algorithms & Data Structures Lab 3');
      expect(result.success).toBe(true);
    });
  });
});
