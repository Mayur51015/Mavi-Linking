const { generateQrForUsername } = require('../services/qrService');

const getProfileBaseUrl = () => {
  // QR should redirect to frontend identity route /u/:username or /u/:maviId
  return process.env.PUBLIC_APP_URL || process.env.CLIENT_URL || 'https://mavi-linking-mq7d.vercel.app';
};

const getQrForUsername = async (req, res, next) => {
  try {
    const username = (req.params.username || '').toString().trim();
    if (!username) {
      return res.status(400).json({ success: false, message: 'username is required' });
    }

    const targetUrl = `${getProfileBaseUrl()}/u/${encodeURIComponent(username)}?ref=qr`;

    const { dataUrl, fileUrl, svgUrl } = await generateQrForUsername({ username, targetUrl });

    res.status(200).json({
      success: true,
      data: {
        username,
        targetUrl,
        dataUrl,
        fileUrl,
        svgUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

const downloadQr = async (req, res, next) => {
  try {
    const { username } = req.params;
    if (!username) return res.status(400).json({ success: false, message: 'username is required' });

    const targetUrl = `${getProfileBaseUrl()}/u/${encodeURIComponent(username)}?ref=qr`;
    const { fileUrl } = await generateQrForUsername({ username, targetUrl });

    // Stream via redirect since fileUrl is already a static file
    return res.redirect(fileUrl);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQrForUsername,
  downloadQr,
};

