const express = require('express');
const { getPublicProfileByUsername } = require('../controllers/publicProfileController');
const { getQrForUsername, downloadQr } = require('../controllers/qrController');
const { getMetaByUsername } = require('../controllers/publicMetaController');
const { recordScan } = require('../controllers/qrAnalyticsController');

const router = express.Router();

router.get('/public/u/:username', getPublicProfileByUsername);

router.get('/public/qr/:username', getQrForUsername);
router.get('/public/qr/:username/download', downloadQr);
router.post('/public/qr/:username/scan', recordScan);

router.get('/public/meta/:username', getMetaByUsername);

module.exports = router;

