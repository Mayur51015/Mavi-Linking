const express = require('express');
const { getPublicProfileByUsername } = require('../controllers/publicProfileController');
const { getQrForUsername, downloadQr } = require('../controllers/qrController');
const { getMetaByUsername } = require('../controllers/publicMetaController');

const {
  validateInstitutionCode,
  getPublicDepartmentsByInstitution,
} = require('../controllers/publicInstitutionController');

const router = express.Router();

// Institution Code & Public Department Lookup (Student Onboarding)
router.get('/public/institutions/by-code/:institutionCode', validateInstitutionCode);
router.get('/public/institutions/:institutionId/departments', getPublicDepartmentsByInstitution);

router.get('/public/u/:username', getPublicProfileByUsername);

router.get('/public/qr/:username', getQrForUsername);
router.get('/public/qr/:username/download', downloadQr);

router.get('/public/meta/:username', getMetaByUsername);

// Development-only SMTP & Email test endpoint
if (process.env.NODE_ENV !== 'production') {
  router.post('/public/test-email', async (req, res) => {
    const { sendAdminInvitationEmail } = require('../utils/sendEmail');
    const { to, name, role, institutionName, departmentName } = req.body;
    const testRecipient = to || process.env.EMAIL_USER;
    if (!testRecipient) {
      return res.status(400).json({ success: false, message: 'Recipient email is required.' });
    }
    const result = await sendAdminInvitationEmail({
      to: testRecipient,
      name: name || 'Test Admin',
      role: role || 'institution_admin',
      institutionName: institutionName || 'Zeal College of Engineering and Research',
      departmentName: departmentName || 'Computer Science and Engineering',
      managementScope: departmentName ? 'DEPARTMENT' : 'INSTITUTION',
      invitationLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/accept-invite?token=test_token_12345`,
      expiresHours: 48,
    });
    return res.status(result.success ? 200 : 500).json(result);
  });
}

module.exports = router;

