const nodemailer = require('nodemailer');

/**
 * Utility to send transactional emails (Password Reset, OTP, Account Verification)
 * 
 * Supports SMTP (Gmail, SendGrid, Mailgun, Amazon SES) via environment variables.
 * Falls back to test Ethereal transport in development if no SMTP pass is provided.
 */
const sendEmail = async ({ to, subject, html, text, templateName }) => {
  if (process.env.NODE_ENV === 'test') {
    return { success: true, messageId: 'test_mock_message_id' };
  }
  try {
    console.log(`[EMAIL] Preparing email dispatch`);
    console.log(`[EMAIL] Recipient: ${to || 'UNKNOWN'}`);
    if (templateName) console.log(`[EMAIL] Template: ${templateName}`);
    console.log(`[EMAIL] Subject: ${subject || 'No Subject'}`);
    console.log(`[EMAIL] Sending...`);

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      console.error(`[EMAIL ERROR] Invalid or missing recipient email address: ${to}`);
      return { success: false, error: 'INVALID_RECIPIENT_EMAIL' };
    }

    let transporter;

    const emailHost = (process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
    const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);
    const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
    const emailPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();

    if (emailUser && emailPass) {
      // Production / Development Gmail SMTP Transporter
      transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465, // true for 465, false for 587
        family: 4, // Force IPv4 to prevent 15-20s connection timeout on dual-stack IPv6 networks
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    } else {
      // Test / Dev Ethereal Account Fallback
      console.warn('[EMAIL WARNING] SMTP credentials (EMAIL_USER & EMAIL_PASS) not set in .env. Attempting Ethereal test account transport...');
      try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      } catch (err) {
        console.error('[EMAIL ERROR] Failed to create test Ethereal account:', err.message);
        return { success: false, error: err.message };
      }
    }

    const fromAddress = process.env.EMAIL_FROM || `"MAVI Linking Security" <${emailUser || 'noreply@mavilinking.com'}>`;

    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ''),
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Sent successfully (MessageID: ${info.messageId} | Target: ${to})`);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EMAIL PREVIEW URL] ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || null,
    };
  } catch (error) {
    console.error(`[EMAIL ERROR] Delivery failed for ${to}:`, error.message || error);
    return {
      success: false,
      error: error.message || 'EMAIL_DELIVERY_FAILED',
    };
  }
};

/**
 * Generate Dark Theme HTML Email for Password Recovery (OTP + Reset Link)
 */
const generatePasswordResetEmailHtml = ({ name, otp, resetLink }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>MAVI Linking — Password Reset Request</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 24px; }
        .brand { font-size: 24px; font-weight: 800; color: #a855f7; letter-spacing: 0.05em; text-transform: uppercase; }
        .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 10px; }
        .content { font-size: 15px; line-height: 1.6; color: #a1a1aa; }
        .otp-box { background: rgba(168, 85, 247, 0.1); border: 2px dashed #a855f7; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: monospace; font-size: 36px; font-weight: 800; color: #c084fc; letter-spacing: 8px; margin: 8px 0; }
        .btn-link { display: inline-block; background: linear-gradient(135deg, #a855f7, #6366f1); color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 16px 0; }
        .footer { font-size: 12px; color: #71717a; text-align: center; border-top: 1px solid #27272a; padding-top: 20px; margin-top: 32px; }
        .warning { background: rgba(234, 179, 8, 0.1); border-left: 4px solid #eab308; color: #fde047; padding: 12px 16px; border-radius: 4px; font-size: 13px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">MAVI Linking</div>
          <div class="title">Password Reset Request</div>
        </div>
        <div class="content">
          <p>Hello ${name || 'User'},</p>
          <p>We received a password reset request for your MAVI account linked to this verified recovery email address.</p>
          
          <div class="otp-box">
            <div style="font-size: 12px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px;">Your 6-Digit Security OTP</div>
            <div class="otp-code">${otp}</div>
            <div style="font-size: 12px; color: #e4e4e7;">Enter this OTP on the recovery screen</div>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <p style="font-size: 13px; color: #a1a1aa;">Or click the secure direct reset link below:</p>
            <a href="${resetLink}" class="btn-link" target="_blank">Reset My Password</a>
          </div>

          <div class="warning">
            <strong>Security Notice:</strong> This OTP code and reset link are strictly valid for <strong>10 minutes</strong>. If you did not request this password reset, please ignore this email or contact security.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} MAVI Linking Security Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate Dark Theme HTML Email for Account Activation (Teacher / Recruiter Invitations)
 */
const generateAccountInvitationEmailHtml = ({ name, role, institutionName, activationLink, expiresMinutes = 10, expiresHours }) => {
  const roleTitle = role === 'teacher' ? 'Teacher / Faculty' : role === 'recruiter' ? 'Corporate Recruiter' : role === 'department_admin' ? 'Department Administrator' : 'Staff Member';
  const validityText = '10 minutes';
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>MAVI Linking — Account Invitation & Activation</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 24px; }
        .brand { font-size: 24px; font-weight: 800; color: #a855f7; letter-spacing: 0.05em; text-transform: uppercase; }
        .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 10px; }
        .content { font-size: 15px; line-height: 1.6; color: #a1a1aa; }
        .info-card { background: rgba(255, 255, 255, 0.03); border: 1px solid #27272a; border-radius: 10px; padding: 18px; margin: 20px 0; }
        .btn-link { display: inline-block; background: linear-gradient(135deg, #a855f7, #6366f1); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 20px 0; }
        .footer { font-size: 12px; color: #71717a; text-align: center; border-top: 1px solid #27272a; padding-top: 20px; margin-top: 32px; }
        .warning { background: rgba(234, 179, 8, 0.1); border-left: 4px solid #eab308; color: #fde047; padding: 12px 16px; border-radius: 4px; font-size: 13px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">MAVI Linking</div>
          <div class="title">Account Activation & Setup</div>
        </div>
        <div class="content">
          <p>Hello ${name || 'User'},</p>
          <p>You have been officially provisioned an account on <strong>MAVI Linking</strong> as a <strong>${roleTitle}</strong>.</p>
          
          <div class="info-card">
            <div style="font-size: 13px; color: #a1a1aa; margin-bottom: 4px;">Institution / Organization</div>
            <div style="font-size: 16px; font-weight: 700; color: #ffffff;">${institutionName || 'Zeal College of Engineering and Research'}</div>
            <div style="font-size: 13px; color: #c084fc; margin-top: 8px;">Assigned Role: <strong>${roleTitle}</strong></div>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <p style="font-size: 14px; color: #e4e4e7;">Click the secure link below to set up your password and activate your account:</p>
            <a href="${activationLink}" class="btn-link" target="_blank">Activate ${roleTitle} Account</a>
          </div>

          <div class="warning">
            <strong>Security Notice:</strong> No default password is sent in plain text. You will create your confidential password directly on the activation portal. This single-use link is valid for <strong>${validityText}</strong>. Please complete your account setup before the invitation expires.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} MAVI Linking Identity Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate Dark Theme HTML Email for Email Change OTP Verification (sent to NEW email)
 */
const generateEmailChangeOtpEmailHtml = ({ name, otp, newEmail }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>MAVI Linking — Verify Your Email Change</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 24px; }
        .brand { font-size: 24px; font-weight: 800; color: #a855f7; letter-spacing: 0.05em; text-transform: uppercase; }
        .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 10px; }
        .content { font-size: 15px; line-height: 1.6; color: #a1a1aa; }
        .otp-box { background: rgba(168, 85, 247, 0.1); border: 2px dashed #a855f7; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: monospace; font-size: 36px; font-weight: 800; color: #c084fc; letter-spacing: 8px; margin: 8px 0; }
        .footer { font-size: 12px; color: #71717a; text-align: center; border-top: 1px solid #27272a; padding-top: 20px; margin-top: 32px; }
        .warning { background: rgba(234, 179, 8, 0.1); border-left: 4px solid #eab308; color: #fde047; padding: 12px 16px; border-radius: 4px; font-size: 13px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">MAVI Linking</div>
          <div class="title">Verify New Email Address</div>
        </div>
        <div class="content">
          <p>Hello ${name || 'User'},</p>
          <p>You requested to change your MAVI account email address to <strong>${newEmail}</strong>.</p>
          
          <div class="otp-box">
            <div style="font-size: 12px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px;">6-Digit Verification Code</div>
            <div class="otp-code">${otp}</div>
            <div style="font-size: 12px; color: #e4e4e7;">Enter this code on MAVI Linking to complete verification</div>
          </div>

          <div class="warning">
            <strong>Security Notice:</strong> This code expires in <strong>10 minutes</strong>. If you did not initiate this email change request, please contact security immediately.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} MAVI Linking Security Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate Dark Theme HTML Email for Security Notification (sent to OLD email)
 */
const generateEmailChangeNotificationOldEmailHtml = ({ name, oldEmail, newEmail, maviId, timestamp }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>MAVI Linking — Email Address Changed</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 24px; }
        .brand { font-size: 24px; font-weight: 800; color: #a855f7; letter-spacing: 0.05em; text-transform: uppercase; }
        .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 10px; }
        .content { font-size: 15px; line-height: 1.6; color: #a1a1aa; }
        .alert-box { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 18px; margin: 20px 0; color: #fca5a5; }
        .footer { font-size: 12px; color: #71717a; text-align: center; border-top: 1px solid #27272a; padding-top: 20px; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">MAVI Linking</div>
          <div class="title">Security Notification — Email Address Changed</div>
        </div>
        <div class="content">
          <p>Hello ${name || 'User'},</p>
          <p>The registered email address for your MAVI Linking account (MAVI ID: <strong>${maviId || 'N/A'}</strong>) was successfully changed.</p>
          
          <div class="alert-box">
            <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; color: #ef4444;">Change Summary</div>
            <div>Previous Email: <code>${oldEmail}</code></div>
            <div>New Email: <code>${newEmail}</code></div>
            <div>Timestamp: ${timestamp || new Date().toISOString()}</div>
          </div>

          <p>Your MAVI ID, PRN, linked platform accounts (GitHub, LeetCode, LinkedIn), projects, analytics, and achievements remain fully intact on your permanent MAVI identity.</p>

          <div style="background: rgba(234, 179, 8, 0.1); border-left: 4px solid #eab308; color: #fde047; padding: 12px 16px; border-radius: 4px; font-size: 13px; margin: 20px 0;">
            <strong>Did not make this change?</strong> If you did not authorize this email update, your account may be compromised. Please secure your account or contact institutional support immediately.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} MAVI Linking Security Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate Dark Theme HTML Email for Student Account Verification
 */
const generateStudentVerificationEmailHtml = ({ name, verificationLink, expiresMinutes = 10, expiresHours }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify your MAVI Linking account</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 24px; }
        .brand { font-size: 24px; font-weight: 800; color: #a855f7; letter-spacing: 0.05em; text-transform: uppercase; }
        .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 10px; }
        .content { font-size: 15px; line-height: 1.6; color: #a1a1aa; }
        .btn-link { display: inline-block; background: linear-gradient(135deg, #a855f7, #6366f1); color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 20px 0; }
        .footer { font-size: 12px; color: #71717a; text-align: center; border-top: 1px solid #27272a; padding-top: 20px; margin-top: 32px; }
        .warning { background: rgba(234, 179, 8, 0.1); border-left: 4px solid #eab308; color: #fde047; padding: 12px 16px; border-radius: 4px; font-size: 13px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">MAVI Linking</div>
          <div class="title">Verify your MAVI Linking account</div>
        </div>
        <div class="content">
          <p>Hello ${name || 'Student'},</p>
          <p>Welcome to MAVI Linking. Your account has been created successfully. Please verify your email address to activate your account and access your dashboard.</p>
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="${verificationLink}" class="btn-link" target="_blank">Verify My MAVI Linking Account</a>
          </div>

          <div class="warning">
            <strong>Security Notice:</strong> This verification link is valid for <strong>10 minutes</strong> and can only be used once. If you did not register for a MAVI Linking account, please disregard this message.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} MAVI Linking Security Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate Dark Theme HTML Email for Institution Admin to Verify Student MAVI ID & Identity
 */
const generateInstitutionAdminStudentVerificationEmailHtml = ({
  adminName,
  studentName,
  studentEmail,
  maviId,
  prn,
  institutionName,
  verificationLink,
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Student MAVI ID Verification Request — MAVI Linking</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 24px; }
        .brand { font-size: 24px; font-weight: 800; color: #a855f7; letter-spacing: 0.05em; text-transform: uppercase; }
        .title { font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 10px; }
        .content { font-size: 15px; line-height: 1.6; color: #a1a1aa; }
        .info-box { background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 10px; padding: 18px; margin: 20px 0; }
        .btn-link { display: inline-block; background: linear-gradient(135deg, #a855f7, #6366f1); color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 16px 0; }
        .footer { font-size: 12px; color: #71717a; text-align: center; border-top: 1px solid #27272a; padding-top: 20px; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">MAVI Linking</div>
          <div class="title">Student MAVI ID Verification Request</div>
        </div>
        <div class="content">
          <p>Hello ${adminName || 'Institution Administrator'},</p>
          <p>A student has registered under <strong>${institutionName || 'your institution'}</strong> and requires identity & MAVI ID verification.</p>
          
          <div class="info-box">
            <table width="100%" style="border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa;">Student Name:</td>
                <td style="padding: 6px 0; color: #ffffff; font-weight: 700; text-align: right;">${studentName || 'Student'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa;">Email Address:</td>
                <td style="padding: 6px 0; color: #ffffff; font-weight: 700; text-align: right;">${studentEmail}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa;">Permanent MAVI ID:</td>
                <td style="padding: 6px 0; color: #c084fc; font-weight: 800; font-family: monospace; text-align: right;">${maviId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa;">PRN / Roll No:</td>
                <td style="padding: 6px 0; color: #ffffff; font-weight: 700; text-align: right;">${prn || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <p>As an authorized Institution Administrator, please review the student's credentials and verify their MAVI ID to grant full platform access.</p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${verificationLink}" class="btn-link" target="_blank">Verify Student MAVI ID & Account</a>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} MAVI Linking Security Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate Dark Theme HTML Email for Promoted Administrator Invitation
 */
const generateAdminInvitationEmailHtml = ({
  name,
  role = 'institution_admin',
  institutionName,
  departmentName,
  managementScope = 'INSTITUTION',
  invitationLink,
  expiresMinutes = 10,
  expiresHours,
}) => {
  const formatRoleTitle = (r) => {
    if (!r) return 'Administrator';
    const mapping = {
      super_admin: 'Platform Super Administrator',
      platform_owner: 'Platform Owner',
      institution_admin: 'Institution Administrator',
      department_admin: 'Department Administrator',
      placement_admin: 'Placement Administrator',
      academic_admin: 'Academic Administrator',
      admin: 'Administrator',
    };
    return mapping[r] || r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const roleTitle = formatRoleTitle(role);
  const scopeTitle = (managementScope || (departmentName ? 'DEPARTMENT' : institutionName ? 'INSTITUTION' : 'PLATFORM')).toUpperCase();
  const validityText = '10 minutes';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>MAVI Linking — Administrator Invitation</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 24px; }
        .brand { font-size: 24px; font-weight: 800; color: #a855f7; letter-spacing: 0.05em; text-transform: uppercase; }
        .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 10px; }
        .content { font-size: 15px; line-height: 1.6; color: #a1a1aa; }
        .info-card { background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 10px; padding: 20px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .info-row:last-child { border-bottom: none; }
        .btn-link { display: inline-block; background: linear-gradient(135deg, #a855f7, #6366f1); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 20px 0; }
        .footer { font-size: 12px; color: #71717a; text-align: center; border-top: 1px solid #27272a; padding-top: 20px; margin-top: 32px; }
        .warning { background: rgba(234, 179, 8, 0.1); border-left: 4px solid #eab308; color: #fde047; padding: 12px 16px; border-radius: 4px; font-size: 13px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">MAVI Linking</div>
          <div class="title">Administrative Invitation & Account Setup</div>
        </div>
        <div class="content">
          <p>Hello ${name || 'Administrator'},</p>
          <p>You have been officially invited to join and administer the <strong>MAVI Linking</strong> platform as a <strong>${roleTitle}</strong>.</p>
          
          <div class="info-card">
            <table width="100%" style="border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa;">Assigned Role:</td>
                <td style="padding: 6px 0; color: #c084fc; font-weight: 700; text-align: right;">${roleTitle}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa;">Management Scope:</td>
                <td style="padding: 6px 0; color: #ffffff; font-weight: 700; text-align: right;">${scopeTitle}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa;">Institution:</td>
                <td style="padding: 6px 0; color: #ffffff; font-weight: 700; text-align: right;">${institutionName || 'Platform Wide'}</td>
              </tr>
              ${departmentName ? `
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa;">Department:</td>
                <td style="padding: 6px 0; color: #ffffff; font-weight: 700; text-align: right;">${departmentName}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa;">Link Expiration:</td>
                <td style="padding: 6px 0; color: #e4e4e7; text-align: right;">${validityText}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #e4e4e7; text-align: center; margin-top: 16px;">
            Your MAVI Linking administrator invitation is valid for <strong>${validityText}</strong>. Please complete your account setup before the invitation expires.
          </p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${invitationLink}" class="btn-link" target="_blank">Accept Administrator Invitation</a>
          </div>

          <div class="warning">
            <strong>Security Notice:</strong> No plain-text passwords are ever sent via email. You will securely configure your credentials upon accepting the invitation. This single-use link is valid for <strong>${validityText}</strong>.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} MAVI Linking Identity & Security Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Shared service helper to dispatch Admin Invitation Emails safely with error diagnostics
 */
const sendAdminInvitationEmail = async ({
  to,
  name,
  role,
  institutionName,
  departmentName,
  managementScope,
  invitationLink,
  expiresMinutes = 10,
  expiresHours,
}) => {
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    console.error(`[EMAIL ERROR] Recipient email is missing or invalid: ${to}`);
    return { success: false, error: 'ADMIN_EMAIL_REQUIRED' };
  }

  const roleTitle = role ? role.replace(/_/g, ' ') : 'Administrator';
  const html = generateAdminInvitationEmailHtml({
    name,
    role,
    institutionName,
    departmentName,
    managementScope,
    invitationLink,
    expiresMinutes,
    expiresHours,
  });

  return await sendEmail({
    to: to.toLowerCase().trim(),
    subject: `You've been invited to become a MAVI Linking Administrator`,
    html,
    templateName: 'admin-invitation',
  });
};

/**
 * Generate responsive HTML for user lifecycle events (Suspension, Deactivation, Reactivation)
 */
const generateAccountLifecycleEmailHtml = ({ type, name, maviId, role, reason, expiresDate }) => {
  const isSuspension = type === 'SUSPENDED';
  const isDeactivation = type === 'DEACTIVATED';
  const isReactivation = type === 'REACTIVATED';

  const badgeColor = isReactivation ? '#10b981' : isSuspension ? '#f59e0b' : '#ef4444';
  const title = isReactivation
    ? 'Account Access Restored'
    : isSuspension
    ? 'Account Temporarily Suspended'
    : 'Account Deactivated';

  const message = isReactivation
    ? 'Your MAVI Linking account has been reactivated. You may now log in to the portal with your credentials.'
    : isSuspension
    ? 'Your MAVI Linking account has been temporarily suspended by an administrator.'
    : 'Your MAVI Linking account has been deactivated by an administrator.';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d1117; margin: 0; padding: 40px 10px; color: #e6edf3;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #161b22; border-radius: 12px; border: 1px solid #30363d; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
    <tr>
      <td style="padding: 30px; text-align: center; border-bottom: 1px solid #21262d; background: linear-gradient(135deg, rgba(88, 28, 135, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%);">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">MAVI LINKING</h1>
        <p style="margin: 5px 0 0 0; font-size: 13px; color: #8b949e; text-transform: uppercase; letter-spacing: 1px;">Security & Account Governance</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 35px 30px;">
        <div style="display: inline-block; padding: 4px 12px; background: rgba(255,255,255,0.05); border: 1px solid ${badgeColor}; border-radius: 20px; font-size: 12px; font-weight: 600; color: ${badgeColor}; margin-bottom: 16px;">
          ${type}
        </div>
        <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 600; color: #f0f6fc;">${title}</h2>
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #8b949e;">
          Hello <strong style="color: #ffffff;">${name || 'User'}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #c9d1d9;">
          ${message}
        </p>
        
        <table width="100%" style="background: #0d1117; border: 1px solid #30363d; border-radius: 8px; margin: 20px 0; padding: 15px;">
          ${maviId ? `<tr><td style="padding: 6px 12px; color: #8b949e; font-size: 13px; width: 140px;">MAVI ID:</td><td style="padding: 6px 12px; color: #ffffff; font-family: monospace; font-size: 13px; font-weight: 600;">${maviId}</td></tr>` : ''}
          ${role ? `<tr><td style="padding: 6px 12px; color: #8b949e; font-size: 13px;">Role:</td><td style="padding: 6px 12px; color: #ffffff; font-size: 13px;">${role}</td></tr>` : ''}
          ${reason ? `<tr><td style="padding: 6px 12px; color: #8b949e; font-size: 13px;">Reason:</td><td style="padding: 6px 12px; color: #f87171; font-size: 13px;">${reason}</td></tr>` : ''}
          ${expiresDate ? `<tr><td style="padding: 6px 12px; color: #8b949e; font-size: 13px;">Suspended Until:</td><td style="padding: 6px 12px; color: #fbbf24; font-size: 13px;">${new Date(expiresDate).toUTCString()}</td></tr>` : ''}
        </table>

        ${
          isReactivation
            ? `<div style="text-align: center; margin: 30px 0 10px 0;">
                <a href="${process.env.CLIENT_URL || 'https://mavilinking.com'}/login" style="display: inline-block; padding: 12px 28px; background: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Sign In to Portal</a>
               </div>`
            : `<p style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.5; color: #8b949e;">If you believe this was done in error or require further assistance, please contact your institution administration or platform support team.</p>`
        }
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background: #0d1117; border-top: 1px solid #21262d; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #484f58;">&copy; ${new Date().getFullYear()} MAVI Linking System. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Dispatch Account Lifecycle Notification Email
 */
const sendAccountLifecycleEmail = async ({ to, name, maviId, role, type, reason, expiresDate }) => {
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    return { success: false, error: 'INVALID_EMAIL' };
  }

  const subjectMap = {
    SUSPENDED: 'MAVI Linking — Account Temporarily Suspended',
    DEACTIVATED: 'MAVI Linking — Account Deactivated',
    REACTIVATED: 'MAVI Linking — Account Access Restored',
  };

  const html = generateAccountLifecycleEmailHtml({
    type,
    name,
    maviId,
    role,
    reason,
    expiresDate,
  });

  return await sendEmail({
    to: to.toLowerCase().trim(),
    subject: subjectMap[type] || `MAVI Linking — Account Status Update (${type})`,
    html,
    templateName: `account-lifecycle-${type.toLowerCase()}`,
  });
};

module.exports = {
  sendEmail,
  sendAdminInvitationEmail,
  sendAccountLifecycleEmail,
  generateAccountLifecycleEmailHtml,
  generateAdminInvitationEmailHtml,
  generatePasswordResetEmailHtml,
  generateAccountInvitationEmailHtml,
  generateEmailChangeOtpEmailHtml,
  generateEmailChangeNotificationOldEmailHtml,
  generateStudentVerificationEmailHtml,
  generateInstitutionAdminStudentVerificationEmailHtml,
};


