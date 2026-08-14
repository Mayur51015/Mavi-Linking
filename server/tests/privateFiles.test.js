const path = require('path');
const fs = require('fs');
const os = require('os');

const {
  UPLOADS_DIR,
  QR_DIR,
  PUBLIC_DIR,
  resolveWithin,
  resolveUpload,
  resolveExistingUpload,
  sanitizeDownloadName,
  sendPrivateFile,
  deleteUpload,
} = require('../src/utils/privateFiles');

describe('resolveWithin', () => {
  const base = path.resolve('/srv/app/public/uploads');

  it('resolves an ordinary relative path', () => {
    expect(resolveWithin(base, 'doc-123.pdf')).toBe(path.join(base, 'doc-123.pdf'));
  });

  it('allows a nested path that stays inside the base', () => {
    expect(resolveWithin(base, '2026/doc.pdf')).toBe(path.join(base, '2026', 'doc.pdf'));
  });

  it('refuses traversal out of the base directory', () => {
    for (const attempt of [
      '../secrets.env',
      '../../../etc/passwd',
      'a/../../b.pdf',
      './../../server.js',
    ]) {
      expect(resolveWithin(base, attempt)).toBeNull();
    }
  });

  it('refuses percent-encoded traversal', () => {
    for (const attempt of ['%2e%2e/secrets.env', '..%2fsecrets.env', '%2E%2E%2Fsecrets.env']) {
      expect(resolveWithin(base, attempt)).toBeNull();
    }
  });

  it('refuses a malformed percent sequence rather than guessing', () => {
    expect(resolveWithin(base, '%E0%A4%A')).toBeNull();
  });

  it('refuses an absolute path', () => {
    expect(resolveWithin(base, '/etc/passwd')).toBeNull();
  });

  it('refuses a NUL byte, raw or encoded', () => {
    expect(resolveWithin(base, 'doc.pdf\u0000.png')).toBeNull();
    expect(resolveWithin(base, 'doc.pdf%00.png')).toBeNull();
  });

  it('does not treat a sibling directory with the same prefix as inside', () => {
    // /srv/app/public/uploads-archive must not pass a check for
    // /srv/app/public/uploads.
    expect(resolveWithin(base, '../uploads-archive/doc.pdf')).toBeNull();
  });

  it('refuses empty and non-string input', () => {
    for (const value of ['', undefined, null, 42, {}, []]) {
      expect(resolveWithin(base, value)).toBeNull();
    }
  });
});

describe('resolveUpload', () => {
  it('accepts the shape actually stored in fileUrl', () => {
    expect(resolveUpload('/public/uploads/doc-1.pdf')).toBe(path.join(UPLOADS_DIR, 'doc-1.pdf'));
  });

  it('accepts the same path without a leading slash', () => {
    expect(resolveUpload('public/uploads/doc-1.pdf')).toBe(path.join(UPLOADS_DIR, 'doc-1.pdf'));
  });

  it('accepts a bare filename', () => {
    expect(resolveUpload('doc-1.pdf')).toBe(path.join(UPLOADS_DIR, 'doc-1.pdf'));
  });

  it('tolerates surrounding whitespace', () => {
    expect(resolveUpload('  /public/uploads/doc-1.pdf  ')).toBe(
      path.join(UPLOADS_DIR, 'doc-1.pdf')
    );
  });

  it('refuses a stored value that climbs out of the uploads directory', () => {
    // Nothing writes this today. The check is here so that stays true even if
    // something later does.
    for (const stored of [
      '/public/uploads/../../.env',
      '/public/../../../etc/passwd',
      '../reports/report_someone.pdf',
    ]) {
      expect(resolveUpload(stored)).toBeNull();
    }
  });

  it('refuses a sibling directory under public rather than reinterpreting it', () => {
    // `/public/reports/x.pdf` stays inside the uploads directory once the
    // `public/` prefix is stripped, so containment alone would let it through
    // as `uploads/reports/x.pdf` — a different file than the caller named.
    expect(resolveUpload('/public/reports/report_someone.pdf')).toBeNull();
    expect(resolveUpload('/public/qr/qr_someone.png')).toBeNull();
  });

  it('refuses empty and non-string values', () => {
    for (const value of ['', '   ', undefined, null, 0, {}]) {
      expect(resolveUpload(value)).toBeNull();
    }
  });

  it('keeps the uploads directory underneath public, next to qr', () => {
    expect(UPLOADS_DIR).toBe(path.join(PUBLIC_DIR, 'uploads'));
    expect(QR_DIR).toBe(path.join(PUBLIC_DIR, 'qr'));
  });
});

describe('resolveExistingUpload', () => {
  let created;

  beforeAll(() => {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    created = path.join(UPLOADS_DIR, `test-fixture-${process.pid}.pdf`);
    fs.writeFileSync(created, '%PDF-1.4 fixture');
  });

  afterAll(() => {
    if (created && fs.existsSync(created)) fs.unlinkSync(created);
  });

  it('returns the path for a file that is there', () => {
    expect(resolveExistingUpload(`/public/uploads/${path.basename(created)}`)).toBe(created);
  });

  it('returns null for a file that is not', () => {
    expect(resolveExistingUpload('/public/uploads/definitely-not-here.pdf')).toBeNull();
  });

  it('returns null for a directory', () => {
    expect(resolveExistingUpload('/public/uploads/')).toBeNull();
  });

  it('returns null for a traversal, without distinguishing it from a miss', () => {
    // A client must not be able to tell "not allowed" from "not found".
    expect(resolveExistingUpload('/public/uploads/../../package.json')).toBeNull();
  });
});

describe('sanitizeDownloadName', () => {
  it('keeps an ordinary filename', () => {
    expect(sanitizeDownloadName('Semester 4 Marksheet.pdf')).toBe('Semester 4 Marksheet.pdf');
  });

  it('strips directory components', () => {
    expect(sanitizeDownloadName('../../etc/passwd')).toBe('passwd');
    expect(sanitizeDownloadName('C:\\Windows\\system.ini')).toBe('C:Windowssystem.ini');
  });

  it('strips quotes and control characters that would break the header', () => {
    // The CRLF is removed outright, so the injected header folds into the
    // filename instead of becoming a header of its own.
    expect(sanitizeDownloadName('re"port\r\nX-Injected: 1.pdf')).toBe('reportX-Injected: 1.pdf');
  });

  it('falls back when nothing usable is left', () => {
    expect(sanitizeDownloadName('')).toBe('document');
    expect(sanitizeDownloadName('"""')).toBe('document');
    expect(sanitizeDownloadName(null, 'report.pdf')).toBe('report.pdf');
  });
});

describe('sendPrivateFile', () => {
  const buildRes = () => ({
    setHeader: jest.fn(),
    download: jest.fn(),
    sendFile: jest.fn(),
  });

  it('sets nosniff and a private no-store cache policy', () => {
    const res = buildRes();

    sendPrivateFile(res, '/srv/app/public/uploads/doc.pdf', { filename: 'doc.pdf' });

    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store, max-age=0');
  });

  it('downloads by default', () => {
    const res = buildRes();

    sendPrivateFile(res, '/srv/app/public/uploads/doc.pdf', { filename: 'Marksheet.pdf' });

    expect(res.download).toHaveBeenCalledWith('/srv/app/public/uploads/doc.pdf', 'Marksheet.pdf');
    expect(res.sendFile).not.toHaveBeenCalled();
  });

  it('serves inline when asked, with an explicit disposition', () => {
    const res = buildRes();

    sendPrivateFile(res, '/srv/app/public/uploads/doc.pdf', {
      filename: 'Marksheet.pdf',
      download: false,
    });

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'inline; filename="Marksheet.pdf"'
    );
    expect(res.sendFile).toHaveBeenCalledWith('/srv/app/public/uploads/doc.pdf');
    expect(res.download).not.toHaveBeenCalled();
  });

  it('sanitizes the filename before it reaches the header', () => {
    const res = buildRes();

    sendPrivateFile(res, '/srv/app/public/uploads/doc.pdf', {
      filename: 'ev"il\r\nSet-Cookie: a=b.pdf',
      download: false,
    });

    const disposition = res.setHeader.mock.calls.find(
      ([header]) => header === 'Content-Disposition'
    )[1];

    expect(disposition).not.toContain('"il');
    expect(disposition).not.toContain('\r');
    expect(disposition).not.toContain('\n');
  });

  it('falls back to the basename when no filename is given', () => {
    const res = buildRes();

    sendPrivateFile(res, '/srv/app/public/uploads/doc-42.pdf');

    expect(res.download).toHaveBeenCalledWith('/srv/app/public/uploads/doc-42.pdf', 'doc-42.pdf');
  });
});

describe('deleteUpload', () => {
  it('removes a file inside the uploads directory', () => {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    const target = path.join(UPLOADS_DIR, `delete-fixture-${process.pid}.pdf`);
    fs.writeFileSync(target, 'x');

    expect(deleteUpload(`/public/uploads/${path.basename(target)}`)).toBe(true);
    expect(fs.existsSync(target)).toBe(false);
  });

  it('reports false for a file that is already gone', () => {
    expect(deleteUpload('/public/uploads/never-existed.pdf')).toBe(false);
  });

  it('refuses to unlink anything outside the uploads directory', () => {
    const outside = path.join(os.tmpdir(), `must-survive-${process.pid}.txt`);
    fs.writeFileSync(outside, 'x');

    try {
      expect(deleteUpload(`/public/uploads/../../../../../../${outside}`)).toBe(false);
      expect(fs.existsSync(outside)).toBe(true);
    } finally {
      fs.unlinkSync(outside);
    }
  });

  it('ignores empty values instead of resolving to the directory itself', () => {
    expect(deleteUpload('')).toBe(false);
    expect(deleteUpload(undefined)).toBe(false);
    expect(fs.existsSync(UPLOADS_DIR)).toBe(true);
  });
});

describe('the static mount', () => {
  const serverSource = fs.readFileSync(require.resolve('../src/server.js'), 'utf8');

  it('no longer serves the whole public directory', () => {
    expect(serverSource).not.toMatch(/express\.static\(path\.join\(__dirname, '\.\.', 'public'\)\)/u);
  });

  it('serves only the qr directory', () => {
    expect(serverSource).toContain("app.use('/public/qr', express.static(QR_DIR));");
  });
});

describe('the controllers that serve uploads', () => {
  const read = (file) => fs.readFileSync(require.resolve(`../src/controllers/${file}`), 'utf8');

  it.each(['documentController.js', 'userDocumentController.js'])(
    '%s no longer builds a path by interpolating a stored fileUrl',
    (file) => {
      expect(read(file)).not.toContain("path.join(__dirname, '..', '..', ");
    }
  );

  it('aiController streams the report instead of writing it to a public directory', () => {
    const source = read('aiController.js');

    expect(source).not.toContain("'public', 'reports'");
    expect(source).not.toContain('/public/reports/');
    expect(source).toContain('doc.pipe(res)');
  });
});
