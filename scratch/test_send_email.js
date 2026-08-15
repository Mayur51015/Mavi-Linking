const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const { sendEmail, generateAccountInvitationEmailHtml } = require('../server/src/utils/sendEmail');

const testSend = async () => {
  console.log('Testing SendGrid / SMTP Dispatch to vijaydev172006@gmail.com...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS present?:', !!process.env.EMAIL_PASS);

  const activationLink = 'http://localhost:5173/activate-account?token=testtoken123';
  const html = generateAccountInvitationEmailHtml({
    name: 'Vaibhav Khandare',
    role: 'teacher',
    institutionName: 'Zeal College of Engineering and Research',
    activationLink,
    expiresHours: 48,
  });

  const res = await sendEmail({
    to: 'vijaydev172006@gmail.com',
    subject: 'Account Activation: Set Password & Access your MAVI Teacher Account',
    html,
  });

  console.log('Result:', res);
};

testSend();
