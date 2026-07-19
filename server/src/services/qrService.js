const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

// In-memory cache to avoid regenerating frequently.
// For production scale, this can be swapped for Redis.
const memoryCache = new Map(); // key -> { dataUrl, updatedAt }
const CACHE_TTL_MS = parseInt(process.env.QR_CACHE_TTL_MS || '86400000', 10); // 24h default

const getQrKey = ({ username, targetUrl }) => {
  return `${username}::${targetUrl}`;
};

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const qrToFilePath = (publicBaseDir, filename) => path.join(publicBaseDir, filename);

/**
 * Generate QR for a username profile.
 * Returns { dataUrl, fileUrl }
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

  // Persist as PNG and SVG for download.
  const publicReportsDir = path.join(__dirname, '..', '..', 'public', 'qr');
  ensureDir(publicReportsDir);

  const timestamp = Date.now();
  const filenamePng = `qr_${encodeURIComponent(username)}_${timestamp}.png`;
  const filenameSvg = `qr_${encodeURIComponent(username)}_${timestamp}.svg`;
  
  const filePathPng = qrToFilePath(publicReportsDir, filenamePng);
  const filePathSvg = qrToFilePath(publicReportsDir, filenameSvg);

  const base64 = dataUrl.split(',')[1];
  fs.writeFileSync(filePathPng, Buffer.from(base64, 'base64'));
  fs.writeFileSync(filePathSvg, svgData, 'utf8');

  const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
  const fileUrl = `${serverUrl}/public/qr/${filenamePng}`;
  const svgUrl = `${serverUrl}/public/qr/${filenameSvg}`;

  const result = { dataUrl, fileUrl, svgUrl };
  memoryCache.set(key, { value: result, updatedAt: now });
  return result;
};

module.exports = {
  generateQrForUsername,
};

