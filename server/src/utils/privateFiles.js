const path = require('path');
const fs = require('fs');

/**
 * Helpers for serving files that are stored on disk but are NOT public.
 *
 * Uploads live under `server/public/uploads`, and until now the whole of
 * `server/public` was mounted with `express.static`. That meant every
 * authorization check in documentController and userDocumentController could be
 * skipped by requesting `/public/uploads/<filename>` directly. Files are now
 * only reachable through those controllers, which call `sendPrivateFile` below.
 *
 * The path resolution is deliberately strict. `fileUrl` values come out of the
 * database, and the old code interpolated them straight into `path.join`, so a
 * stored value of `../../../etc/passwd` would have resolved outside the upload
 * directory. Nothing writes such a value today; the containment check is here
 * so nothing has to keep being true for that to stay safe.
 */

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
const QR_DIR = path.join(PUBLIC_DIR, 'qr');

/**
 * Resolve `candidate` against `baseDir`, returning the absolute path only if
 * the result is genuinely inside `baseDir`.
 *
 * Returns null rather than throwing: every caller wants to answer 404 for a
 * path it will not serve, and a thrown error would be indistinguishable from a
 * real failure in the global handler.
 */
const resolveWithin = (baseDir, candidate) => {
  if (typeof candidate !== 'string' || candidate.length === 0) return null;

  // A NUL byte truncates the path at the syscall layer, so `a.pdf\0.png` can
  // pass an extension check and open a different file.
  if (candidate.includes('\0')) return null;

  let decoded = candidate;
  try {
    // Handles `%2e%2e%2f`. decodeURIComponent throws on a malformed sequence,
    // which is itself reason enough to refuse the path.
    decoded = decodeURIComponent(candidate);
  } catch {
    return null;
  }

  if (decoded.includes('\0')) return null;

  const base = path.resolve(baseDir);
  const resolved = path.resolve(base, decoded);

  // path.resolve collapses `..`, so this comparison is the containment check.
  // The separator suffix stops `/public/uploads-old` matching `/public/uploads`.
  if (resolved !== base && !resolved.startsWith(base + path.sep)) return null;

  return resolved;
};

/**
 * Turn a stored `fileUrl` into an absolute path inside the uploads directory.
 *
 * Accepts the shapes that are actually in the database — `/public/uploads/x`,
 * `public/uploads/x`, and a bare filename — and rejects everything else,
 * including absolute paths and anything that climbs out of the directory.
 */
const resolveUpload = (fileUrl) => {
  if (typeof fileUrl !== 'string') return null;

  const trimmed = fileUrl.trim();
  if (!trimmed) return null;

  let relative = trimmed.replace(/^\/+/u, '');

  // A value that names some other directory under public/ — `reports/`, say —
  // must be refused, not quietly reinterpreted as `uploads/reports/...`. So the
  // `public/` prefix only survives if `uploads/` follows it.
  if (/^public\//iu.test(relative)) {
    relative = relative.slice('public/'.length);
    if (!/^uploads\//iu.test(relative)) return null;
  }

  relative = relative.replace(/^uploads\/+/iu, '');

  return resolveWithin(UPLOADS_DIR, relative);
};

/**
 * Resolve and confirm the file is actually on disk.
 * Returns null for both "not allowed" and "not there", which are the same 404
 * to a caller and should not be distinguishable to a client either.
 */
const resolveExistingUpload = (fileUrl) => {
  const resolved = resolveUpload(fileUrl);
  if (!resolved) return null;

  try {
    if (!fs.statSync(resolved).isFile()) return null;
  } catch {
    return null;
  }

  return resolved;
};

/**
 * Strip anything from a user-supplied filename that would let it break out of
 * the Content-Disposition header or suggest a path to the browser.
 */
const sanitizeDownloadName = (name, fallback = 'document') => {
  const base = path.basename(String(name || ''))
    .replace(/[\u0000-\u001f\u007f"\\]/gu, '')
    .replace(/[/\\]/gu, '')
    .trim();

  return base || fallback;
};

/**
 * Send a private file with headers that keep it out of shared caches and stop
 * the browser from sniffing it into something executable.
 *
 * `download: false` serves it inline so a PDF preview still works in an iframe;
 * either way the bytes only leave the server after the caller's authorization
 * check has already passed.
 */
const sendPrivateFile = (res, absolutePath, { filename, download = true } = {}) => {
  const name = sanitizeDownloadName(filename || path.basename(absolutePath));

  res.setHeader('X-Content-Type-Options', 'nosniff');
  // These files are per-user; a proxy must never hold one for the next caller.
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');

  if (download) {
    return res.download(absolutePath, name);
  }

  res.setHeader('Content-Disposition', `inline; filename="${name}"`);
  return res.sendFile(absolutePath);
};

/**
 * Best-effort removal of an upload whose database row is going away. Returns
 * whether a file was actually unlinked so callers can log accurately.
 */
const deleteUpload = (fileUrl) => {
  const resolved = resolveUpload(fileUrl);
  if (!resolved) return false;

  try {
    fs.unlinkSync(resolved);
    return true;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to delete upload:', error.message);
    }
    return false;
  }
};

module.exports = {
  PUBLIC_DIR,
  UPLOADS_DIR,
  QR_DIR,
  resolveWithin,
  resolveUpload,
  resolveExistingUpload,
  sanitizeDownloadName,
  sendPrivateFile,
  deleteUpload,
};
