const path = require('path');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
const rawPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();
const emailPass = rawPass.replace(/^["']|["']$/g, '').replace(/\s+/g, '');

(async () => {
  console.log('Testing transport options with direct sendMail...');

  // Configuration A: service: 'gmail', direct (no pool)
  console.log('\n--- TEST A: service: gmail (direct, no pool) ---');
  try {
    const transporterA = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass },
    });
    const infoA = await transporterA.sendMail({
      from: `"EduTalentX Test" <${emailUser}>`,
      to: emailUser,
      subject: 'EduTalentX Test A - Direct Gmail Transport',
      text: 'Testing direct Gmail transport without pooling.',
    });
    console.log('Test A Success! messageId:', infoA.messageId, 'response:', infoA.response);
  } catch (err) {
    console.error('Test A Failed:', err.message);
  }

  // Configuration B: host: smtp.gmail.com, port: 465, secure: true
  console.log('\n--- TEST B: smtp.gmail.com port 465 SSL ---');
  try {
    const transporterB = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: emailUser, pass: emailPass },
    });
    const infoB = await transporterB.sendMail({
      from: `"EduTalentX Test" <${emailUser}>`,
      to: emailUser,
      subject: 'EduTalentX Test B - Port 465 SSL',
      text: 'Testing Port 465 SSL transport.',
    });
    console.log('Test B Success! messageId:', infoB.messageId, 'response:', infoB.response);
  } catch (err) {
    console.error('Test B Failed:', err.message);
  }

  // Configuration C: host: smtp.gmail.com, port: 587, secure: false (STARTTLS)
  console.log('\n--- TEST C: smtp.gmail.com port 587 STARTTLS ---');
  try {
    const transporterC = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: emailUser, pass: emailPass },
    });
    const infoC = await transporterC.sendMail({
      from: `"EduTalentX Test" <${emailUser}>`,
      to: emailUser,
      subject: 'EduTalentX Test C - Port 587 STARTTLS',
      text: 'Testing Port 587 STARTTLS transport.',
    });
    console.log('Test C Success! messageId:', infoC.messageId, 'response:', infoC.response);
  } catch (err) {
    console.error('Test C Failed:', err.message);
  }
})();
