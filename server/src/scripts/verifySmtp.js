const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env if present
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const { getTransporter, getSmtpConfig, validateSmtpConfig, maskEmail } = require('../utils/sendEmail');

const verifySmtpDiagnostic = async () => {
  console.log('====================================================');
  console.log('  EduTalentX — SMTP Diagnostic Connection Verifier');
  console.log('====================================================');

  const config = getSmtpConfig();
  console.log(`Target Host:     ${config.host}`);
  console.log(`Target Port:     ${config.port}`);
  console.log(`Username (Mask): ${maskEmail(config.user)}`);
  console.log(`Sender Address:  ${config.configuredFrom || maskEmail(config.user) || '(not specified)'}`);
  console.log('----------------------------------------------------');

  // 1. Validate required credentials exist without printing secret values
  const validation = validateSmtpConfig();
  if (!validation.isValid) {
    console.error(`❌ [VALIDATION ERROR] ${validation.error}`);
    console.error('Please configure SMTP_USER and SMTP_PASS in your environment.');
    process.exit(1);
  }

  console.log(`Initiating SMTP verification handshake to ${config.host}:${config.port}...`);
  const startTime = Date.now();

  try {
    // 2. Obtain application's standard transporter and run verify()
    const transporter = await getTransporter();
    await transporter.verify();
    const durationMs = Date.now() - startTime;

    console.log('====================================================');
    console.log(`✅ SMTP VERIFICATION SUCCEEDED (${durationMs}ms)`);
    console.log('====================================================');
    console.log(`Host:    ${config.host}`);
    console.log(`Port:    ${config.port}`);
    console.log(`User:    ${maskEmail(config.user)}`);
    console.log(`Status:  SMTP_CONNECTED`);
    console.log('Result:  Connection and authentication verified successfully.');
    console.log('Ready to deliver transactional emails.');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error('====================================================');
    console.error(`❌ SMTP VERIFICATION FAILED (${durationMs}ms)`);
    console.error('====================================================');
    console.error(`Host:       ${config.host}:${config.port}`);
    console.error(`User:       ${maskEmail(config.user)}`);
    console.error(`Error Code: ${err.code || 'UNKNOWN_ERROR'}`);
    console.error(`Message:    ${err.message || 'SMTP verification failed'}`);

    // 3. Clear, sanitized diagnostic reporting
    if (err.code === 'ETIMEDOUT' || err.message?.includes('timeout')) {
      console.error('\n[DIAGNOSIS: ETIMEDOUT]');
      console.error(`TCP connection attempt to ${config.host}:${config.port} timed out.`);
      console.error('Render Free restricts outbound SMTP traffic on ports 25, 465, and 587.');
      console.error('Port 2525 was attempted as an alternative.');
      console.error('If port 2525 also times out on Render Free:');
      console.error('-> Render Free is blocking outbound connections to port 2525.');
      console.error('-> Recommendation: Migrate email dispatch to Brevo HTTP API over HTTPS (port 443).');
    } else if (err.code === 'EAUTH' || err.responseCode === 535) {
      console.error('\n[DIAGNOSIS: EAUTH]');
      console.error('SMTP server rejected authentication credentials.');
      console.error('-> Ensure SMTP_USER matches your exact Brevo account login email.');
      console.error('-> Ensure SMTP_PASS is an active Brevo SMTP key (starting with xsmtpsib-),');
      console.error('   NOT your Brevo API key (v3 API keys will not authenticate via SMTP).');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('\n[DIAGNOSIS: ECONNREFUSED]');
      console.error(`Connection refused by host ${config.host}:${config.port}. Check host and port.`);
    } else if (err.code === 'ENOTFOUND') {
      console.error('\n[DIAGNOSIS: ENOTFOUND]');
      console.error(`DNS lookup failed for host ${config.host}. Check DNS resolution and internet connectivity.`);
    }

    console.error('====================================================');
    process.exit(1);
  }
};

verifySmtpDiagnostic();
