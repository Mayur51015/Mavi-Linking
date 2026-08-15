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

module.exports = router;

