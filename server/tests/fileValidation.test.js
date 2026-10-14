const {
  STORAGE_BUCKETS,
  BUCKET_POLICIES,
  validateFile,
  validateFileSignature,
  generateStoragePath,
} = require('../src/utils/fileValidation');

describe('File Upload Security & Validation Unit Tests', () => {
  describe('validateFile', () => {
    it('rejects missing or undefined file', () => {
      const res = validateFile(null, STORAGE_BUCKETS.RESUMES);
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/no file provided/i);
    });

    it('rejects unknown storage buckets', () => {
      const file = { originalname: 'doc.pdf', mimetype: 'application/pdf', size: 1000 };
      const res = validateFile(file, 'unknown-bucket-xyz');
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/unknown storage bucket/i);
    });

    it('rejects disallowed file extensions', () => {
      const file = {
        originalname: 'script.exe',
        mimetype: 'application/x-msdownload',
        size: 500,
      };
      const res = validateFile(file, STORAGE_BUCKETS.RESUMES);
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/invalid file extension/i);
    });

    it('rejects disallowed MIME types', () => {
      const file = {
        originalname: 'resume.pdf',
        mimetype: 'text/html',
        size: 500,
      };
      const res = validateFile(file, STORAGE_BUCKETS.RESUMES);
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/invalid mime type/i);
    });

    it('rejects files exceeding bucket maxSizeBytes', () => {
      const limit = BUCKET_POLICIES[STORAGE_BUCKETS.PROFILE_IMAGES].maxSizeBytes;
      const file = {
        originalname: 'avatar.png',
        mimetype: 'image/png',
        size: limit + 1024,
      };
      const res = validateFile(file, STORAGE_BUCKETS.PROFILE_IMAGES);
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/exceeds maximum allowed size/i);
    });

    it('detects spoofed file signatures (e.g. executable spoofed as PDF)', () => {
      const spoofedBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00'); // DOS/PE binary
      const file = {
        originalname: 'malicious.pdf',
        mimetype: 'application/pdf',
        size: spoofedBuffer.length,
        buffer: spoofedBuffer,
      };
      const res = validateFile(file, STORAGE_BUCKETS.RESUMES);
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/does not match the expected file signature/i);
    });

    it('validates authentic PDF file buffer', () => {
      const validPdfBuffer = Buffer.from('%PDF-1.4\n%...\ntrailer\n%%EOF');
      const file = {
        originalname: 'resume.pdf',
        mimetype: 'application/pdf',
        size: validPdfBuffer.length,
        buffer: validPdfBuffer,
      };
      const res = validateFile(file, STORAGE_BUCKETS.RESUMES);
      expect(res.valid).toBe(true);
    });

    it('validates authentic PNG file buffer', () => {
      const validPngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
      const file = {
        originalname: 'profile.png',
        mimetype: 'image/png',
        size: validPngBuffer.length,
        buffer: validPngBuffer,
      };
      const res = validateFile(file, STORAGE_BUCKETS.PROFILE_IMAGES);
      expect(res.valid).toBe(true);
    });
  });

  describe('validateFileSignature', () => {
    it('validates JPEG magic bytes', () => {
      const jpegBuf = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00]);
      expect(validateFileSignature(jpegBuf, 'image/jpeg', '.jpg')).toBe(true);
    });

    it('validates WEBP magic bytes', () => {
      const webpBuf = Buffer.from('RIFF\x00\x00\x00\x00WEBP');
      expect(validateFileSignature(webpBuf, 'image/webp', '.webp')).toBe(true);
    });

    it('validates SVG content', () => {
      const svgBuf = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle /></svg>');
      expect(validateFileSignature(svgBuf, 'image/svg+xml', '.svg')).toBe(true);
    });

    it('returns false for buffer shorter than 4 bytes', () => {
      const tinyBuf = Buffer.from([0x01, 0x02]);
      expect(validateFileSignature(tinyBuf, 'application/pdf', '.pdf')).toBe(false);
    });
  });

  describe('generateStoragePath', () => {
    it('generates structured storage path containing category and ownerId', () => {
      const path = generateStoragePath('resumes', 'user-12345', 'my_cv.pdf');
      expect(path).toMatch(/^resumes\/user-12345\/\d+_[a-f0-9]+\.pdf$/);
    });

    it('sanitizes directory traversal characters from category and ownerId', () => {
      const path = generateStoragePath('../../../etc', '../../evil/user', 'exploit.pdf');
      expect(path).not.toContain('..');
      expect(path).toMatch(/^etc\/eviluser\/\d+_[a-f0-9]+\.pdf$/);
    });

    it('falls back to .bin if filename has no extension', () => {
      const path = generateStoragePath('resumes', 'user-1', 'noext');
      expect(path.endsWith('.bin')).toBe(true);
    });
  });
});
