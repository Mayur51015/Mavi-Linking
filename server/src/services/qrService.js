const QRCode = require('qrcode');

// In-memory cache to avoid regenerating frequently.
const memoryCache = new Map(); // key -> { value, updatedAt }
const CACHE_TTL_MS = parseInt(process.env.QR_CACHE_TTL_MS || '86400000', 10); // 24h default

const getQrKey = ({ username, targetUrl }) => `${username}::${targetUrl}`;

/**
 * Generate QR for a username profile.
 * Returns { dataUrl, fileUrl, svgUrl }
 */
const generateQrForUsername = async ({ username, targetUrl }) => {
  if (!username || !targetUrl) throw new Error('username and targetUrl are required');

  const key = getQrKey({ username, targetUrl });
  const cached = memoryCache.get(key);
  const now = Date.now();

  if (cached && now - cached.updatedAt < CACHE_TTL_MS) {
    return cached.value;
  }

  const dataUrl = await QRCode.toDataURL(targetUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 420,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  const svgData = await QRCode.toString(targetUrl, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`;

  const result = { dataUrl, fileUrl: dataUrl, svgUrl };
  memoryCache.set(key, { value: result, updatedAt: now });
  return result;
};

module.exports = {
  generateQrForUsername,
};

