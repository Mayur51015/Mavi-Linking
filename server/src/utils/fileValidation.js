const path = require('path');
const crypto = require('crypto');

/**
 * Storage Buckets and their configuration
 */
const STORAGE_BUCKETS = {
  PROFILE_IMAGES: 'profile-images',
  INSTITUTION_LOGOS: 'institution-logos',
  CERTIFICATES: 'certificates',
  RESUMES: 'resumes',
  INSTITUTION_DOCUMENTS: 'institution-documents',
  PROJECT_ASSETS: 'project-assets',
};

/**
 * Category-specific constraints
 */
const BUCKET_POLICIES = {
  [STORAGE_BUCKETS.PROFILE_IMAGES]: {
    isPublic: true,
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  [STORAGE_BUCKETS.INSTITUTION_LOGOS]: {
    isPublic: true,
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  },
  [STORAGE_BUCKETS.CERTIFICATES]: {
    isPublic: false,
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  [STORAGE_BUCKETS.RESUMES]: {
    isPublic: false,
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.pdf', '.doc', '.docx'],
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  [STORAGE_BUCKETS.INSTITUTION_DOCUMENTS]: {
    isPublic: false,
    maxSizeBytes: 15 * 1024 * 1024, // 15MB
    allowedExtensions: ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.zip', '.xls', '.xlsx', '.ppt', '.pptx'],
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'application/zip',
      'application/x-zip-compressed',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
  },
  [STORAGE_BUCKETS.PROJECT_ASSETS]: {
    isPublic: true,
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
  },
};

/**
 * Validate buffer magic numbers / file signatures
 */
const validateFileSignature = (buffer, mimeType, ext) => {
  if (!buffer || buffer.length < 4) {
    return false;
  }

  // PDF signature: %PDF (25 50 44 46)
  if (mimeType === 'application/pdf' || ext === '.pdf') {
    return buffer.length >= 4 &&
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46;
  }

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === 'image/png' || ext === '.png') {
    return buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0D &&
      buffer[5] === 0x0A &&
      buffer[6] === 0x1A &&
      buffer[7] === 0x0A;
  }

  // JPEG signature: FF D8 FF
  if (mimeType === 'image/jpeg' || ext === '.jpg' || ext === '.jpeg') {
    return buffer.length >= 3 &&
      buffer[0] === 0xFF &&
      buffer[1] === 0xD8 &&
      buffer[2] === 0xFF;
  }

  // GIF signature: GIF87a or GIF89a (47 49 46 38)
  if (mimeType === 'image/gif' || ext === '.gif') {
    return buffer.length >= 4 &&
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38;
  }

  // WEBP signature: RIFF....WEBP
  if (mimeType === 'image/webp' || ext === '.webp') {
    if (buffer.length < 12) return false;
    const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  // ZIP / DOCX / XLSX / PPTX signature: PK.. (50 4B 03 04 or 50 4B 05 06 or 50 4B 07 08)
  if (
    ext === '.docx' ||
    ext === '.xlsx' ||
    ext === '.pptx' ||
    ext === '.zip' ||
    mimeType.includes('openxmlformats') ||
    mimeType.includes('zip')
  ) {
    return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B;
  }

  // SVG text format
  if (mimeType === 'image/svg+xml' || ext === '.svg') {
    const textStart = buffer.slice(0, 100).toString('utf8').trim().toLowerCase();
    return textStart.includes('<svg') || textStart.includes('<?xml');
  }

  // Legacy Word DOC: D0 CF 11 E0
  if (ext === '.doc' || mimeType === 'application/msword') {
    return buffer.length >= 4 &&
      buffer[0] === 0xD0 &&
      buffer[1] === 0xCF &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xE0;
  }

  return true;
};

/**
 * Validate an uploaded file against bucket policies
 */
const validateFile = (file, bucket) => {
  if (!file) {
    return { valid: false, message: 'No file provided.' };
  }

  const policy = BUCKET_POLICIES[bucket];
  if (!policy) {
    return { valid: false, message: `Unknown storage bucket: ${bucket}` };
  }

  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!policy.allowedExtensions.includes(ext)) {
    return {
      valid: false,
      message: `Invalid file extension "${ext}". Allowed: ${policy.allowedExtensions.join(', ')}`,
    };
  }

  const mimeType = file.mimetype?.toLowerCase();
  if (mimeType && !policy.allowedMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      message: `Invalid MIME type "${mimeType}". Allowed: ${policy.allowedMimeTypes.join(', ')}`,
    };
  }

  const fileSize = file.size || (file.buffer ? file.buffer.length : 0);
  if (fileSize > policy.maxSizeBytes) {
    const maxMb = (policy.maxSizeBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      message: `File exceeds maximum allowed size of ${maxMb}MB.`,
    };
  }

  if (file.buffer && !validateFileSignature(file.buffer, mimeType, ext)) {
    return {
      valid: false,
      message: 'File content does not match the expected file signature.',
    };
  }

  return { valid: true };
};

/**
 * Generate secure, predictable but non-guessable storage path
 */
const generateStoragePath = (category, ownerId, originalName) => {
  const ext = path.extname(originalName || '').toLowerCase().replace(/[^a-z0-9.]/g, '') || '.bin';
  const cleanCategory = String(category).replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanOwnerId = String(ownerId).replace(/[^a-zA-Z0-9_-]/g, '');
  const uniqueId = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

  return `${cleanCategory}/${cleanOwnerId}/${uniqueId}${ext}`;
};

module.exports = {
  STORAGE_BUCKETS,
  BUCKET_POLICIES,
  validateFile,
  validateFileSignature,
  generateStoragePath,
};
