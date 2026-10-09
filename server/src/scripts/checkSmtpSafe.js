const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const { sendEmail, verifySmtpConnection } = require('../utils/sendEmail');

(async () => {
  try {
    console.log('--- 1. VERIFY SMTP CONNECTION ---');
    const verifyResult = await verifySmtpConnection();
    console.log('verifySmtpConnection:', verifyResult);

    console.log('\n--- 2. SEND CONTROLLED TEST EMAIL ---');
    const recipient = process.env.EMAIL_USER;
    console.log('Sending test email to:', recipient);

    const result = await sendEmail({
      to: recipient,
      subject: 'EduTalentX SMTP Pipeline Diagnostic Verification',
      text: 'This is a diagnostic test email to verify end-to-end SMTP delivery for EduTalentX / MAVI-Linking.',
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #09090b; color: #ffffff;">
          <h2 style="color: #3b82f6;">EduTalentX SMTP Pipeline Diagnostic</h2>
          <p>This is a controlled diagnostic email confirming that the Nodemailer SMTP pipeline is functioning correctly.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    console.log('\n--- 3. SEND RESULT ---');
    console.log('success:', result.success);
    console.log('status:', result.status);
    console.log('messageId:', result.messageId);
    console.log('accepted:', result.accepted);
    console.log('rejected:', result.rejected);
    console.log('response:', result.response);
    console.log('error:', result.error);
  } catch (err) {
    console.error('Fatal error during send:', err);
  }
})();
