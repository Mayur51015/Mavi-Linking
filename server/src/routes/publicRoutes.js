const express = require('express');
const { getPublicProfileByUsername } = require('../controllers/publicProfileController');
const { getQrForUsername, downloadQr } = require('../controllers/qrController');
const { getMetaByUsername } = require('../controllers/publicMetaController');

const router = express.Router();

router.get('/public/u/:username', getPublicProfileByUsername);

router.get('/public/qr/:username', getQrForUsername);
router.get('/public/qr/:username/download', downloadQr);

router.get('/public/meta/:username', getMetaByUsername);

module.exports = router;

