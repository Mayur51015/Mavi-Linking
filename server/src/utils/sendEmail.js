const nodemailer = require('nodemailer');

/**
 * Utility to send transactional emails (Password Reset, OTP, Account Verification)
 * 
 * Supports SMTP (Gmail, SendGrid, Mailgun, Amazon SES) via environment variables.
 * Falls back to test Ethereal transport in development if no SMTP pass is provided.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    let transporter;

    const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);
    const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

    if (emailUser && emailPass) {
      // Production SMTP Transporter
      transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465, // true for 465, false for 587
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
    console.log(`[EMAIL DISPATCHED] MessageID: ${info.messageId} | Target: ${to}`);

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
    console.error('[EMAIL DISPATCH ERROR]', error);
    return {
      success: false,
      error: error.message,
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
            <strong>Security Notice:</strong> This OTP code and reset link are strictly valid for <strong>15 minutes</strong>. If you did not request this password reset, please ignore this email or contact security.
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
const generateAccountInvitationEmailHtml = ({ name, role, institutionName, activationLink, expiresHours = 48 }) => {
  const roleTitle = role === 'teacher' ? 'Teacher / Faculty' : role === 'recruiter' ? 'Corporate Recruiter' : role === 'department_admin' ? 'Department Administrator' : 'Staff Member';
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
            <strong>Security Notice:</strong> No default password is sent in plain text. You will create your confidential password directly on the activation portal. This single-use link expires in <strong>${expiresHours} hours</strong>.
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

module.exports = {
  sendEmail,
  generatePasswordResetEmailHtml,
  generateAccountInvitationEmailHtml,
};
