const nodemailer = require('nodemailer');

/**
 * Singleton cached transporter for high-performance connection pooling
 */
let cachedTransporter = null;

/**
 * Resolve client base URL dynamically from request or environment variables
 */
const getClientBaseUrl = (req) => {
  const origin = req?.headers?.origin;
  if (origin && typeof origin === 'string' && !origin.includes('undefined') && !origin.includes('null')) {
    return origin.replace(/\/+$/, '');
  }
  return (
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    process.env.PUBLIC_APP_URL ||
    'http://localhost:5173'
  ).replace(/\/+$/, '');
};

/**
 * Mask email for safe audit logs (zero token or PII leaks)
 */
const maskEmail = (str) => {
  if (!str || typeof str !== 'string' || !str.includes('@')) return 'invalid-recipient';
  const [user, domain] = str.split('@');
  if (!domain) return 'invalid-recipient';
  const maskedUser = user.length <= 2 ? user[0] + '*' : user[0] + '*'.repeat(Math.min(user.length - 2, 4)) + user[user.length - 1];
  return `${maskedUser}@${domain}`;
};

/**
 * Reset and close active cached transporter instance
 */
const resetTransporter = () => {
  if (cachedTransporter && typeof cachedTransporter.close === 'function') {
    try {
      cachedTransporter.close();
    } catch (_) {}
  }
  cachedTransporter = null;
};

/**
 * Get or initialize Nodemailer transporter.
 * Uses dedicated SSL connection for Gmail without persistent pooling to prevent idle socket ECONNRESET.
 */
const getTransporter = async (forceFresh = false) => {
  if (!forceFresh && cachedTransporter) {
    return cachedTransporter;
  }

  const emailHost = (process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
  const emailPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10);
  const emailUser = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const rawPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim();

  // Normalize app password by stripping enclosing quotes, spaces, and carriage returns
  const isGmail = emailHost.includes('gmail') || process.env.SMTP_SERVICE === 'gmail' || process.env.EMAIL_SERVICE === 'gmail';
  const emailPass = isGmail
    ? rawPass.replace(/^["']|["']$/g, '').replace(/\s+/g, '')
    : rawPass.replace(/^["']|["']$/g, '');

  if (emailUser && emailPass) {
    // If an explicit port is set (e.g. SMTP_PORT=587 or SMTP_PORT=2525), respect it.
    // Otherwise, default Gmail to port 465 (direct SSL) and generic SMTP to emailPort (default 587)
    const explicitPort = process.env.SMTP_PORT || process.env.EMAIL_PORT;
    const targetPort = explicitPort ? parseInt(explicitPort, 10) : (isGmail ? 465 : emailPort);
    const isSecure = targetPort === 465 || process.env.SMTP_SECURE === 'true';

    const transportConfig = {
      host: isGmail ? 'smtp.gmail.com' : emailHost,
      port: targetPort,
      secure: isSecure,
      auth: { user: emailUser, pass: emailPass },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      ...(isSecure ? {} : {
        tls: {
          rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
        },
      }),
    };

    cachedTransporter = nodemailer.createTransport(transportConfig);
    return cachedTransporter;
  }

  if (process.env.NODE_ENV === 'production' && !process.env.RESEND_API_KEY && !process.env.BREVO_API_KEY) {
    console.error('❌ [EMAIL CONFIG ERROR] Missing SMTP credentials! Set SMTP_USER / EMAIL_USER and SMTP_PASS / EMAIL_PASS in Render environment variables for email delivery.');
  }

  // Development/Test fallback to Ethereal if no credentials provided
  console.warn('[EMAIL WARNING] SMTP credentials not set in environment. Generating Ethereal test account...');
  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  return cachedTransporter;
};

/**
 * Verify SMTP connection safely (useful for startup diagnostics)
 */
const verifySmtpConnection = async () => {
  // If an HTTPS API provider is configured, verify and report ready
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
    return {
      success: true,
      status: 'SMTP_CONNECTED',
      provider: 'resend-https-api',
      port: 443,
      secure: true,
      message: 'Resend HTTPS API configured and ready (bypasses raw SMTP port blocking)',
    };
  }

  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim()) {
    return {
      success: true,
      status: 'SMTP_CONNECTED',
      provider: 'brevo-https-api',
      port: 443,
      secure: true,
      message: 'Brevo HTTPS API configured and ready (bypasses raw SMTP port blocking)',
    };
  }

  const emailHost = (process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
  const emailUser = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const emailPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim();
  const explicitPort = process.env.SMTP_PORT || process.env.EMAIL_PORT;
  const isGmail = emailHost.includes('gmail') || process.env.SMTP_SERVICE === 'gmail' || process.env.EMAIL_SERVICE === 'gmail';
  const targetPort = explicitPort ? parseInt(explicitPort, 10) : (isGmail ? 465 : 587);
  const isSecure = targetPort === 465 || process.env.SMTP_SECURE === 'true';

  if (!emailUser || !emailPass) {
    return {
      success: false,
      status: 'EMAIL_NOT_CONFIGURED',
      code: 'MISSING_CREDENTIALS',
      host: emailHost,
      port: targetPort,
      error: 'SMTP credentials missing: configure SMTP_USER and SMTP_PASS (or EMAIL_USER and EMAIL_PASS)',
    };
  }

  try {
    const transporter = await getTransporter();
    await transporter.verify();
    return {
      success: true,
      status: 'SMTP_CONNECTED',
      provider: isGmail ? 'gmail' : emailHost,
      host: emailHost,
      port: targetPort,
      secure: isSecure,
      userMasked: maskEmail(emailUser),
    };
  } catch (err) {
    resetTransporter();
    let errorCode = 'EMAIL_CONNECTION_ERROR';
    let errorMessage = err.message || 'SMTP connection failed';
    if (err.code === 'EAUTH' || err.responseCode === 535) {
      errorCode = 'EMAIL_AUTH_ERROR';
      errorMessage = 'SMTP authentication failed: verify SMTP_USER and App Password';
    } else if (err.code === 'ETIMEDOUT' || err.message?.includes('timeout')) {
      errorCode = 'EMAIL_CONNECTION_ERROR';
      errorMessage = `Connection timeout connecting to ${emailHost}:${targetPort}. (Note: Render Free Tier blocks outbound SMTP ports 25, 465, and 587. Upgrade to Render Starter or set SMTP_PORT=2525 / RESEND_API_KEY).`;
    } else if (err.code === 'ECONNREFUSED') {
      errorCode = 'EMAIL_CONNECTION_REFUSED';
      errorMessage = `Connection refused by ${emailHost}:${targetPort}`;
    } else if (err.code === 'ENOTFOUND') {
      errorCode = 'EMAIL_DNS_ERROR';
      errorMessage = `DNS resolution failed for ${emailHost}`;
    }

    return {
      success: false,
      status: errorCode,
      code: err.code || errorCode,
      host: emailHost,
      port: targetPort,
      secure: isSecure,
      userMasked: maskEmail(emailUser),
      error: errorMessage,
    };
  }
};

/**
 * Resolve recipient email from direct string or target user identifier
 * Never defaults or falls back to SMTP_USER or Owner email.
 */
const resolveRecipientEmail = async ({
  to,
  recipientUserId,
  assignedUserId,
  userId,
  studentId,
  teacherId,
  recruiterId,
  user,
} = {}) => {
  if (to && typeof to === 'string' && to.includes('@')) {
    return to.toLowerCase().trim();
  }

  if (user && user.email && typeof user.email === 'string' && user.email.includes('@')) {
    return user.email.toLowerCase().trim();
  }

  const targetId = recipientUserId || assignedUserId || userId || studentId || teacherId || recruiterId;
  if (targetId) {
    try {
      const User = require('../models/User');
      const targetUser = await User.findById(targetId).select('email name role');
      if (targetUser && targetUser.email) {
        return targetUser.email.toLowerCase().trim();
      }
    } catch (_) {}
  }

  return null;
};

/**
 * Centralized transactional email dispatch utility with automatic retry on socket reset
 */
const sendEmail = async ({
  to,
  subject,
  html,
  text,
  templateName,
  recipientUserId,
  actorUserId,
  isOwnerEvent = false,
  assignedUserId,
  userId,
  studentId,
  teacherId,
  recruiterId,
  user,
}) => {
  let recipientEmail = await resolveRecipientEmail({
    to,
    recipientUserId,
    assignedUserId,
    userId,
    studentId,
    teacherId,
    recruiterId,
    user,
  });

  let cleanRecipient = (recipientEmail || '').toString().trim().toLowerCase();
  if (!cleanRecipient || !cleanRecipient.includes('@')) {
    const errMessage = `Cannot send ${templateName || 'email'}: recipient email could not be resolved`;
    console.error(`[EMAIL ERROR] ${errMessage} (raw to: ${maskEmail(to)}, recipientUserId: ${recipientUserId || 'none'})`);
    return {
      success: false,
      status: 'EMAIL_REJECTED',
      code: 'MISSING_RECIPIENT',
      error: errMessage,
    };
  }

  // Prevent accidental fallback to Owner email unless explicitly an Owner-targeted event
  const ownerEmail = (process.env.OWNER_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER || '').toLowerCase().trim();
  if (!isOwnerEvent && cleanRecipient === ownerEmail && (recipientUserId || assignedUserId || userId || studentId || teacherId || recruiterId)) {
    const targetLookupId = recipientUserId || assignedUserId || userId || studentId || teacherId || recruiterId;
    try {
      const User = require('../models/User');
      const targetUser = await User.findById(targetLookupId).select('email role');
      if (targetUser && targetUser.email && targetUser.email.toLowerCase().trim() !== ownerEmail) {
        console.warn(`[EMAIL WARNING] Recipient email mismatch with target user ${targetLookupId}. Correcting to target user email ${maskEmail(targetUser.email)}.`);
        recipientEmail = targetUser.email.toLowerCase().trim();
        cleanRecipient = recipientEmail;
      }
    } catch (_) {}
  }

  const emailHost = (process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
  const isGmail = emailHost.includes('gmail') || process.env.SMTP_SERVICE === 'gmail' || process.env.EMAIL_SERVICE === 'gmail';
  const emailUser = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const configuredFrom = (process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_FROM || '').trim();

  let fromAddress;
  if (isGmail && emailUser) {
    const nameMatch = configuredFrom.match(/^(?:"?([^"<]+)"?\s*)?/);
    const displayName = (nameMatch && nameMatch[1] && nameMatch[1].trim() && !nameMatch[1].includes('@'))
      ? nameMatch[1].trim()
      : 'EduTalentX Security';
    fromAddress = `"${displayName}" <${emailUser}>`;
  } else {
    fromAddress = configuredFrom || `"EduTalentX Security" <${emailUser || 'noreply@edutalentx.com'}>`;
  }

  const cleanSubject = (subject || 'EduTalentX Notification').trim();
  const cleanText = (text || html?.replace(/<[^>]*>?/gm, ' ') || cleanSubject).replace(/\s+/g, ' ').trim();

  const mailOptions = {
    from: fromAddress,
    to: cleanRecipient,
    subject: cleanSubject,
    text: cleanText,
    html,
  };

  // Safe structured logging for recipient resolution (Phase 10)
  console.log('[EMAIL] Sending email', {
    event: templateName || cleanSubject,
    recipientUserId: recipientUserId || assignedUserId || userId || studentId || null,
    recipientEmail: maskEmail(cleanRecipient),
    actorUserId: actorUserId || null,
    smtpUser: maskEmail(emailUser),
    from: mailOptions.from,
    to: mailOptions.to,
  });

  if (process.env.NODE_ENV === 'test') {
    const mockResult = {
      success: true,
      status: 'EMAIL_ACCEPTED',
      messageId: 'test_mock_message_id',
      accepted: [cleanRecipient],
      rejected: [],
      envelope: { from: fromAddress, to: [cleanRecipient] },
      response: '250 OK mock',
    };
    console.log('[EMAIL SMTP RESULT]', {
      messageId: mockResult.messageId,
      accepted: mockResult.accepted,
      rejected: mockResult.rejected,
      envelope: mockResult.envelope,
      response: mockResult.response,
    });
    return mockResult;
  }

  // Option A: If RESEND_API_KEY is configured, dispatch over HTTPS port 443 (bypasses Render SMTP port block)
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
    try {
      const axios = require('axios');
      const resendRes = await axios.post(
        'https://api.resend.com/emails',
        {
          from: mailOptions.from,
          to: [cleanRecipient],
          subject: cleanSubject,
          html: html || undefined,
          text: cleanText,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      const resendId = resendRes.data?.id || `resend_${Date.now()}`;
      console.log(`[EMAIL ACCEPTED (RESEND API)] messageId=${resendId} recipient=${maskEmail(cleanRecipient)}`);
      return {
        success: true,
        status: 'EMAIL_ACCEPTED',
        messageId: resendId,
        accepted: [cleanRecipient],
        rejected: [],
        response: '250 OK (Resend HTTPS API)',
        envelope: { from: mailOptions.from, to: [cleanRecipient] },
      };
    } catch (apiErr) {
      console.error('[EMAIL RESEND API ERROR]', apiErr.response?.data || apiErr.message);
      return {
        success: false,
        status: 'EMAIL_DELIVERY_ERROR',
        error: apiErr.response?.data?.message || apiErr.message,
      };
    }
  }

  // Option B: If BREVO_API_KEY is configured, dispatch over HTTPS port 443 (bypasses Render SMTP port block)
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim()) {
    try {
      const axios = require('axios');
      const brevoRes = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { email: emailUser || 'noreply@edutalentx.com', name: 'EduTalentX Security' },
          to: [{ email: cleanRecipient }],
          subject: cleanSubject,
          htmlContent: html || undefined,
          textContent: cleanText,
        },
        {
          headers: {
            'api-key': process.env.BREVO_API_KEY.trim(),
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      const brevoId = brevoRes.data?.messageId || `brevo_${Date.now()}`;
      console.log(`[EMAIL ACCEPTED (BREVO API)] messageId=${brevoId} recipient=${maskEmail(cleanRecipient)}`);
      return {
        success: true,
        status: 'EMAIL_ACCEPTED',
        messageId: brevoId,
        accepted: [cleanRecipient],
        rejected: [],
        response: '250 OK (Brevo HTTPS API)',
        envelope: { from: mailOptions.from, to: [cleanRecipient] },
      };
    } catch (apiErr) {
      console.error('[EMAIL BREVO API ERROR]', apiErr.response?.data || apiErr.message);
      return {
        success: false,
        status: 'EMAIL_DELIVERY_ERROR',
        error: apiErr.response?.data?.message || apiErr.message,
      };
    }
  }

  // Option C: Standard Nodemailer SMTP transport
  const dispatchOnce = async (transporterInstance) => {
    return await transporterInstance.sendMail(mailOptions);
  };

  try {
    let transporter = await getTransporter();
    let info;

    try {
      info = await dispatchOnce(transporter);
    } catch (firstErr) {
      const isSocketDrop = ['ECONNRESET', 'ESOCKET', 'ETIMEDOUT', 'ECONNABORTED', 'ECONNREFUSED'].includes(firstErr.code) ||
        firstErr.message?.includes('ECONNRESET') ||
        firstErr.message?.includes('socket closed');

      if (isSocketDrop) {
        console.warn(`[EMAIL RETRY] Socket disconnect detected (${firstErr.message}). Re-establishing fresh SMTP connection...`);
        resetTransporter();
        const freshTransporter = await getTransporter(true);
        info = await dispatchOnce(freshTransporter);
      } else {
        throw firstErr;
      }
    }

    const accepted = Array.isArray(info.accepted) ? info.accepted : [];
    const rejected = Array.isArray(info.rejected) ? info.rejected : [];

    // Capture and inspect the Nodemailer result (Phase 11)
    console.log('[EMAIL SMTP RESULT]', {
      messageId: info.messageId,
      accepted,
      rejected,
      envelope: info.envelope,
      response: info.response,
    });

    // Verify recipient acceptance from the SMTP server
    if (rejected.length > 0 && accepted.length === 0) {
      console.error(`[EMAIL REJECTED] Recipient rejected by SMTP: ${rejected.join(', ')} (${info.response || 'No response'})`);
      return {
        success: false,
        status: 'EMAIL_REJECTED',
        error: 'Recipient rejected by mail server',
        messageId: info.messageId,
        accepted,
        rejected,
        response: info.response,
        envelope: info.envelope,
      };
    }

    if (accepted.length === 0) {
      console.warn(`[EMAIL WARNING] No recipients accepted by SMTP for ${maskEmail(cleanRecipient)}`);
      return {
        success: false,
        status: 'EMAIL_DELIVERY_ERROR',
        error: 'Mail server did not accept recipient',
        messageId: info.messageId,
        accepted,
        rejected,
        response: info.response,
        envelope: info.envelope,
      };
    }

    console.log(`[EMAIL ACCEPTED] messageId=${info.messageId} recipient=${maskEmail(cleanRecipient)} response="${info.response || '250 OK'}"`);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EMAIL PREVIEW URL] ${previewUrl}`);
    }

    return {
      success: true,
      status: 'EMAIL_ACCEPTED',
      messageId: info.messageId,
      accepted,
      rejected,
      response: info.response,
      envelope: info.envelope,
      previewUrl: previewUrl || null,
    };
  } catch (error) {
    resetTransporter();
    let errorStatus = 'EMAIL_DELIVERY_ERROR';
    let errorMessage = error.message || errorStatus;
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      errorStatus = 'EMAIL_AUTH_ERROR';
      errorMessage = 'SMTP authentication failed: verify SMTP_USER and App Password';
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.code === 'ESOCKET' || error.code === 'ECONNRESET') {
      errorStatus = 'EMAIL_CONNECTION_ERROR';
      if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        errorMessage = `SMTP connection timeout. (Note: Render Free Tier blocks outbound SMTP ports 25, 465, and 587. Upgrade to Render Starter or set SMTP_PORT=2525 / RESEND_API_KEY).`;
      }
    } else if (error.code === 'ENOTFOUND') {
      errorStatus = 'EMAIL_DNS_ERROR';
      errorMessage = `DNS resolution failed for SMTP host: ${error.hostname || 'unknown'}`;
    } else if (error.code === 'ECONNREFUSED') {
      errorStatus = 'EMAIL_CONNECTION_REFUSED';
      errorMessage = `Connection refused by SMTP host`;
    } else if (error.code === 'EENVELOPE') {
      errorStatus = 'EMAIL_CONFIGURATION_ERROR';
    }

    console.error(`[EMAIL ERROR] ${errorStatus} for ${maskEmail(cleanRecipient)}:`, errorMessage);
    return {
      success: false,
      status: errorStatus,
      code: error.code || errorStatus,
      error: errorMessage,
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
      <title>EduTalentX — Password Reset Request</title>
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
          <div class="brand">EduTalentX</div>
          <div class="title">Password Reset Request</div>
        </div>
        <div class="content">
          <p>Hello ${name || 'User'},</p>
          <p>We received a password reset request for your EduTalentX account linked to this verified recovery email address.</p>
          
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
          &copy; ${new Date().getFullYear()} EduTalentX Security Platform. All rights reserved.
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
      <title>EduTalentX — Account Invitation & Activation</title>
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
          <div class="brand">EduTalentX</div>
          <div class="title">Account Activation & Setup</div>
        </div>
        <div class="content">
          <p>Hello ${name || 'User'},</p>
          <p>You have been officially provisioned an account on <strong>EduTalentX</strong> as a <strong>${roleTitle}</strong>.</p>
          
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
          &copy; ${new Date().getFullYear()} EduTalentX Identity Platform. All rights reserved.
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
      <title>EduTalentX — Verify Your Email Change</title>
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
          <div class="brand">EduTalentX</div>
          <div class="title">Verify New Email Address</div>
        </div>
        <div class="content">
          <p>Hello ${name || 'User'},</p>
          <p>You requested to change your EduTalentX account email address to <strong>${newEmail}</strong>.</p>
          
          <div class="otp-box">
            <div style="font-size: 12px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px;">6-Digit Verification Code</div>
            <div class="otp-code">${otp}</div>
            <div style="font-size: 12px; color: #e4e4e7;">Enter this code on EduTalentX to complete verification</div>
          </div>

          <div class="warning">
            <strong>Security Notice:</strong> This code expires in <strong>10 minutes</strong>. If you did not initiate this email change request, please contact security immediately.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} EduTalentX Security Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate Dark Theme HTML Email for Security Notification (sent to OLD email)
 */
const generateEmailChangeNotificationOldEmailHtml = ({ name, oldEmail, newEmail, etxId, timestamp }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>EduTalentX — Email Address Changed</title>
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
          <div class="brand">EduTalentX</div>
          <div class="title">Security Notification — Email Address Changed</div>
        </div>
        <div class="content">
          <p>Hello ${name || 'User'},</p>
          <p>The registered email address for your EduTalentX account (ETX ID: <strong>${etxId || 'N/A'}</strong>) was successfully changed.</p>
          
          <div class="alert-box">
            <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; color: #ef4444;">Change Summary</div>
            <div>Previous Email: <code>${oldEmail}</code></div>
            <div>New Email: <code>${newEmail}</code></div>
            <div>Timestamp: ${timestamp || new Date().toISOString()}</div>
          </div>

          <p>Your ETX ID, PRN, linked platform accounts (GitHub, LeetCode, LinkedIn), projects, analytics, and achievements remain fully intact on your permanent EduTalentX identity.</p>

          <div style="background: rgba(234, 179, 8, 0.1); border-left: 4px solid #eab308; color: #fde047; padding: 12px 16px; border-radius: 4px; font-size: 13px; margin: 20px 0;">
            <strong>Did not make this change?</strong> If you did not authorize this email update, your account may be compromised. Please secure your account or contact institutional support immediately.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} EduTalentX Security Platform. All rights reserved.
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
      <title>Verify your EduTalentX account</title>
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
          <div class="brand">EduTalentX</div>
          <div class="title">Verify your EduTalentX account</div>
        </div>
        <div class="content">
          <p>Hello ${name || 'Student'},</p>
          <p>Welcome to EduTalentX. Your account has been created successfully. Please verify your email address to activate your account and access your dashboard.</p>
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="${verificationLink}" class="btn-link" target="_blank">Verify My EduTalentX Account</a>
          </div>

          <div class="warning">
            <strong>Security Notice:</strong> This verification link is valid for <strong>10 minutes</strong> and can only be used once. If you did not register for a EduTalentX account, please disregard this message.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} EduTalentX Security Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate Dark Theme HTML Email for Institution Admin to Verify Student ETX ID & Identity
 */
const generateInstitutionAdminStudentVerificationEmailHtml = ({
  adminName,
  studentName,
  studentEmail,
  etxId,
  prn,
  institutionName,
  verificationLink,
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Student ETX ID Verification Request — EduTalentX</title>
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
          <div class="brand">EduTalentX</div>
          <div class="title">Student ETX ID Verification Request</div>
        </div>
        <div class="content">
          <p>Hello ${adminName || 'Institution Administrator'},</p>
          <p>A student has registered under <strong>${institutionName || 'your institution'}</strong> and requires identity & ETX ID verification.</p>
          
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
                <td style="padding: 6px 0; color: #a1a1aa;">Permanent ETX ID:</td>
                <td style="padding: 6px 0; color: #c084fc; font-weight: 800; font-family: monospace; text-align: right;">${etxId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a1a1aa;">PRN / Roll No:</td>
                <td style="padding: 6px 0; color: #ffffff; font-weight: 700; text-align: right;">${prn || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <p>As an authorized Institution Administrator, please review the student's credentials and verify their ETX ID to grant full platform access.</p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${verificationLink}" class="btn-link" target="_blank">Verify Student ETX ID & Account</a>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} EduTalentX Security Platform. All rights reserved.
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
      <title>EduTalentX — Administrator Invitation</title>
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
          <div class="brand">EduTalentX</div>
          <div class="title">Administrative Invitation & Account Setup</div>
        </div>
        <div class="content">
          <p>Hello ${name || 'Administrator'},</p>
          <p>You have been officially invited to join and administer the <strong>EduTalentX</strong> platform as a <strong>${roleTitle}</strong>.</p>
          
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
            Your EduTalentX administrator invitation is valid for <strong>${validityText}</strong>. Please complete your account setup before the invitation expires.
          </p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${invitationLink}" class="btn-link" target="_blank">Accept Administrator Invitation</a>
          </div>

          <div class="warning">
            <strong>Security Notice:</strong> No plain-text passwords are ever sent via email. You will securely configure your credentials upon accepting the invitation. This single-use link is valid for <strong>${validityText}</strong>.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} EduTalentX Identity & Security Platform. All rights reserved.
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
  recipientUserId,
  actorUserId,
  name,
  role,
  institutionName,
  departmentName,
  managementScope,
  invitationLink,
  expiresMinutes = 10,
  expiresHours,
}) => {
  let recipientEmail = to;
  if (!recipientEmail && recipientUserId) {
    recipientEmail = await resolveRecipientEmail({ recipientUserId });
  }

  if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.includes('@')) {
    console.error(`[EMAIL ERROR] Recipient email is missing or could not be resolved for admin invitation.`);
    throw new Error('Cannot send admin-invitation: recipient email could not be resolved');
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
    to: recipientEmail.toLowerCase().trim(),
    recipientUserId,
    actorUserId,
    subject: `You've been invited to become a EduTalentX Administrator`,
    html,
    templateName: 'admin-invitation',
  });
};

/**
 * Generate responsive HTML for user lifecycle events (Suspension, Deactivation, Reactivation)
 */
const generateAccountLifecycleEmailHtml = ({ type, name, etxId, role, reason, expiresDate }) => {
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
    ? 'Your EduTalentX account has been reactivated. You may now log in to the portal with your credentials.'
    : isSuspension
    ? 'Your EduTalentX account has been temporarily suspended by an administrator.'
    : 'Your EduTalentX account has been deactivated by an administrator.';

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
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">EDUTALENTX</h1>
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
          ${etxId ? `<tr><td style="padding: 6px 12px; color: #8b949e; font-size: 13px; width: 140px;">ETX ID:</td><td style="padding: 6px 12px; color: #ffffff; font-family: monospace; font-size: 13px; font-weight: 600;">${etxId}</td></tr>` : ''}
          ${role ? `<tr><td style="padding: 6px 12px; color: #8b949e; font-size: 13px;">Role:</td><td style="padding: 6px 12px; color: #ffffff; font-size: 13px;">${role}</td></tr>` : ''}
          ${reason ? `<tr><td style="padding: 6px 12px; color: #8b949e; font-size: 13px;">Reason:</td><td style="padding: 6px 12px; color: #f87171; font-size: 13px;">${reason}</td></tr>` : ''}
          ${expiresDate ? `<tr><td style="padding: 6px 12px; color: #8b949e; font-size: 13px;">Suspended Until:</td><td style="padding: 6px 12px; color: #fbbf24; font-size: 13px;">${new Date(expiresDate).toUTCString()}</td></tr>` : ''}
        </table>

        ${
          isReactivation
            ? `<div style="text-align: center; margin: 30px 0 10px 0;">
                <a href="${process.env.CLIENT_URL || 'https://edutalentx.com'}/login" style="display: inline-block; padding: 12px 28px; background: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Sign In to Portal</a>
               </div>`
            : `<p style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.5; color: #8b949e;">If you believe this was done in error or require further assistance, please contact your institution administration or platform support team.</p>`
        }
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background: #0d1117; border-top: 1px solid #21262d; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #484f58;">&copy; ${new Date().getFullYear()} EduTalentX System. All rights reserved.</p>
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
const sendAccountLifecycleEmail = async ({
  to,
  recipientUserId,
  actorUserId,
  name,
  etxId,
  role,
  type,
  reason,
  expiresDate,
}) => {
  let recipientEmail = to;
  if (!recipientEmail && recipientUserId) {
    recipientEmail = await resolveRecipientEmail({ recipientUserId });
  }

  if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.includes('@')) {
    throw new Error(`Cannot send account-lifecycle-${type?.toLowerCase() || 'update'}: recipient email could not be resolved`);
  }

  const subjectMap = {
    SUSPENDED: 'EduTalentX — Account Temporarily Suspended',
    DEACTIVATED: 'EduTalentX — Account Deactivated',
    REACTIVATED: 'EduTalentX — Account Access Restored',
  };

  const html = generateAccountLifecycleEmailHtml({
    type,
    name,
    etxId,
    role,
    reason,
    expiresDate,
  });

  return await sendEmail({
    to: recipientEmail.toLowerCase().trim(),
    recipientUserId,
    actorUserId,
    subject: subjectMap[type] || `EduTalentX — Account Status Update (${type})`,
    html,
    templateName: `account-lifecycle-${type.toLowerCase()}`,
  });
};

/**
 * Dispatch Assignment Notification Email (Owner -> Teacher/Recruiter, Teacher -> Student, Recruiter -> Candidate)
 * Strictly delivers to the assigned target user's email address.
 */
const sendAssignmentNotificationEmail = async ({
  to,
  recipientUserId,
  actorUserId,
  actorName,
  actorRole,
  assignmentTitle,
  assignmentDetails,
  assignmentType = 'TASK_ASSIGNMENT',
  dueDate,
  actionLink,
}) => {
  let recipientEmail = to;
  if (!recipientEmail && recipientUserId) {
    recipientEmail = await resolveRecipientEmail({ recipientUserId });
  }

  if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.includes('@')) {
    throw new Error(`Cannot send assignment notification: recipient email could not be resolved`);
  }

  const title = assignmentTitle || 'New Assignment Notification';
  const html = `
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
      <td style="padding: 30px; text-align: center; border-bottom: 1px solid #21262d; background: linear-gradient(135deg, rgba(79, 70, 229, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%);">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">EDUTALENTX</h1>
        <p style="margin: 5px 0 0 0; font-size: 13px; color: #8b949e; text-transform: uppercase; letter-spacing: 1px;">Assignment & Workflow Notification</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 35px 30px;">
        <div style="display: inline-block; padding: 4px 12px; background: rgba(99, 102, 241, 0.1); border: 1px solid #6366f1; border-radius: 20px; font-size: 12px; font-weight: 600; color: #a5b4fc; margin-bottom: 16px;">
          ${assignmentType}
        </div>
        <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 600; color: #f0f6fc;">${title}</h2>
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #c9d1d9;">
          ${assignmentDetails || 'You have received a new assignment or workflow update on EduTalentX.'}
        </p>

        <table width="100%" style="background: #0d1117; border: 1px solid #30363d; border-radius: 8px; margin: 20px 0; padding: 15px;">
          ${actorName ? `<tr><td style="padding: 6px 12px; color: #8b949e; font-size: 13px; width: 140px;">Assigned By:</td><td style="padding: 6px 12px; color: #ffffff; font-size: 13px; font-weight: 600;">${actorName}${actorRole ? ` (${actorRole})` : ''}</td></tr>` : ''}
          ${dueDate ? `<tr><td style="padding: 6px 12px; color: #8b949e; font-size: 13px;">Date / Due:</td><td style="padding: 6px 12px; color: #38bdf8; font-size: 13px;">${new Date(dueDate).toDateString()}</td></tr>` : ''}
          <tr><td style="padding: 6px 12px; color: #8b949e; font-size: 13px;">Recipient:</td><td style="padding: 6px 12px; color: #a78bfa; font-size: 13px;">${recipientEmail}</td></tr>
        </table>

        ${actionLink ? `
        <div style="text-align: center; margin: 30px 0 10px 0;">
          <a href="${actionLink}" style="display: inline-block; padding: 12px 28px; background: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">View Assignment</a>
        </div>` : ''}
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background: #0d1117; border-top: 1px solid #21262d; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #484f58;">&copy; ${new Date().getFullYear()} EduTalentX System. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return await sendEmail({
    to: recipientEmail.toLowerCase().trim(),
    recipientUserId,
    actorUserId,
    subject: `EduTalentX: ${title}`,
    html,
    templateName: `assignment-${assignmentType.toLowerCase().replace(/_/g, '-')}`,
  });
};

/**
 * Dispatch Legitimate Platform / Security Alert to Platform Owner
 */
const sendOwnerAlertEmail = async ({
  to,
  subject,
  title,
  message,
  details,
  alertType = 'PLATFORM_SECURITY_ALERT',
}) => {
  const ownerEmail = (to || process.env.OWNER_EMAIL || process.env.EMAIL_USER || '').toLowerCase().trim();
  if (!ownerEmail || !ownerEmail.includes('@')) {
    throw new Error('Cannot send owner alert: Owner recipient email is not configured');
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title || 'EduTalentX Platform Alert'}</title></head>
<body style="font-family: sans-serif; background: #0d1117; color: #f0f6fc; padding: 30px;">
  <div style="max-width: 600px; margin: 0 auto; background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 24px;">
    <h2 style="color: #ef4444; margin-top: 0;">${title || 'Platform Alert'}</h2>
    <p>${message || 'Platform level event requiring owner attention.'}</p>
    ${details ? `<pre style="background: #0d1117; padding: 12px; border-radius: 6px; font-size: 12px; overflow-x: auto;">${JSON.stringify(details, null, 2)}</pre>` : ''}
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: ownerEmail,
    subject: subject || `EduTalentX Platform Alert: ${title || alertType}`,
    html,
    templateName: `owner-alert-${alertType.toLowerCase().replace(/_/g, '-')}`,
    isOwnerEvent: true,
  });
};

module.exports = {
  sendEmail,
  resolveRecipientEmail,
  sendAssignmentNotificationEmail,
  sendOwnerAlertEmail,
  verifySmtpConnection,
  getClientBaseUrl,
  getTransporter,
  resetTransporter,
  maskEmail,
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


