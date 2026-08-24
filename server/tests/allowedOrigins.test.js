const fs = require('fs');

const {
  DEVELOPMENT_ORIGINS,
  PRODUCTION_ORIGINS,
  normalizeOrigin,
  buildAllowedOrigins,
  isOriginAllowed,
  createOriginChecker,
} = require('../src/config/allowedOrigins');

const VERCEL = 'https://mavi-linking-mq7d.vercel.app';

describe('normalizeOrigin', () => {
  it('leaves a well-formed origin alone', () => {
    expect(normalizeOrigin(VERCEL)).toBe(VERCEL);
  });

  it('strips trailing slashes', () => {
    expect(normalizeOrigin(`${VERCEL}/`)).toBe(VERCEL);
    expect(normalizeOrigin(`${VERCEL}///`)).toBe(VERCEL);
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeOrigin(`  ${VERCEL}  `)).toBe(VERCEL);
  });

  it('lowercases, since scheme and host are case-insensitive', () => {
    expect(normalizeOrigin('HTTPS://Mavi-Linking-MQ7D.Vercel.App')).toBe(VERCEL);
  });

  it('returns null for values that are not usable origins', () => {
    for (const value of ['', '   ', '/', undefined, null, 42, {}]) {
      expect(normalizeOrigin(value)).toBeNull();
    }
  });
});

describe('buildAllowedOrigins', () => {
  it('includes the deployed frontend even when CLIENT_URL is unset', () => {
    // This is the regression. config/socket.js had only localhost:5173 and
    // CLIENT_URL, so with CLIENT_URL unset the deployed frontend could not
    // open a socket while its REST calls worked fine.
    expect(buildAllowedOrigins({ NODE_ENV: 'production' })).toContain(VERCEL);
  });

  it('includes both local hostnames in development', () => {
    const allowed = buildAllowedOrigins({ NODE_ENV: 'development' });

    expect(allowed).toContain('http://localhost:5173');
    expect(allowed).toContain('http://127.0.0.1:5173');
  });

  it('keeps local origins out of the production list', () => {
    const allowed = buildAllowedOrigins({ NODE_ENV: 'production' });

    for (const origin of DEVELOPMENT_ORIGINS) {
      expect(allowed).not.toContain(origin);
    }
  });

  it('accepts a comma-separated CLIENT_URL for preview deployments', () => {
    const allowed = buildAllowedOrigins({
      NODE_ENV: 'production',
      CLIENT_URL: 'https://preview-1.vercel.app, https://preview-2.vercel.app',
    });

    expect(allowed).toContain('https://preview-1.vercel.app');
    expect(allowed).toContain('https://preview-2.vercel.app');
  });

  it('normalises a CLIENT_URL with a trailing slash', () => {
    // server.js used an exact `includes` while socket.js stripped the slash, so
    // this exact value was accepted by one layer and rejected by the other.
    const allowed = buildAllowedOrigins({
      NODE_ENV: 'production',
      CLIENT_URL: 'https://app.example.com/',
    });

    expect(allowed).toContain('https://app.example.com');
    expect(allowed).not.toContain('https://app.example.com/');
  });

  it('de-duplicates a CLIENT_URL that repeats a built-in origin', () => {
    const allowed = buildAllowedOrigins({ NODE_ENV: 'production', CLIENT_URL: `${VERCEL}/` });

    expect(allowed.filter((origin) => origin === VERCEL)).toHaveLength(1);
  });

  it('ignores empty segments in CLIENT_URL', () => {
    const allowed = buildAllowedOrigins({ CLIENT_URL: ',, ,' });

    expect(allowed).toEqual(
      expect.arrayContaining([...DEVELOPMENT_ORIGINS, ...PRODUCTION_ORIGINS])
    );
    expect(allowed.every(Boolean)).toBe(true);
  });
});

describe('isOriginAllowed', () => {
  const allowed = buildAllowedOrigins({ NODE_ENV: 'production' });

  it('allows a listed origin', () => {
    expect(isOriginAllowed(VERCEL, allowed)).toBe(true);
  });

  it('allows a listed origin with a trailing slash or different casing', () => {
    expect(isOriginAllowed(`${VERCEL}/`, allowed)).toBe(true);
    expect(isOriginAllowed(VERCEL.toUpperCase(), allowed)).toBe(true);
  });

  it('allows a request with no Origin header', () => {
    // curl, Postman, server-to-server and the health check send none, and a
    // browser cannot suppress the header, so refusing here would break
    // non-browser callers without protecting anything.
    for (const value of [undefined, null, '']) {
      expect(isOriginAllowed(value, allowed)).toBe(true);
    }
  });

  it('rejects an origin that is not listed', () => {
    expect(isOriginAllowed('https://evil.example.com', allowed)).toBe(false);
  });

  it('rejects a lookalike host rather than matching on a substring', () => {
    for (const origin of [
      'https://mavi-linking-mq7d.vercel.app.evil.com',
      'https://evil.com/?x=https://mavi-linking-mq7d.vercel.app',
      'http://mavi-linking-mq7d.vercel.app',
    ]) {
      expect(isOriginAllowed(origin, allowed)).toBe(false);
    }
  });

  it('rejects a non-string origin', () => {
    expect(isOriginAllowed({ toString: () => VERCEL }, allowed)).toBe(false);
  });
});

describe('createOriginChecker', () => {
  it('calls back with true for an allowed origin', () => {
    const checker = createOriginChecker({ NODE_ENV: 'development' });
    const callback = jest.fn();

    checker('http://localhost:5173', callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('calls back with an error naming the rejected origin', () => {
    const checker = createOriginChecker({ NODE_ENV: 'production' });
    const callback = jest.fn();

    checker('https://evil.example.com', callback);

    const [error] = callback.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain('https://evil.example.com');
  });

  it('exposes the resolved list for boot-time logging', () => {
    const checker = createOriginChecker({ NODE_ENV: 'production', CLIENT_URL: 'https://a.com' });

    expect(checker.allowedOrigins).toContain('https://a.com');
    expect(checker.allowedOrigins).toContain(VERCEL);
  });

  it('produces the same verdict for the HTTP and the socket layer', () => {
    // The property that was missing: both layers resolve the same list from
    // the same env at the same moment.
    const env = { NODE_ENV: 'production', CLIENT_URL: 'https://app.example.com/' };
    const http = createOriginChecker(env);
    const socket = createOriginChecker(env);

    for (const origin of [
      VERCEL,
      'https://app.example.com',
      'https://app.example.com/',
      'http://localhost:5173',
      'https://evil.example.com',
      undefined,
    ]) {
      const httpResult = jest.fn();
      const socketResult = jest.fn();

      http(origin, httpResult);
      socket(origin, socketResult);

      expect(httpResult.mock.calls[0][1]).toEqual(socketResult.mock.calls[0][1]);
      expect(Boolean(httpResult.mock.calls[0][0])).toBe(Boolean(socketResult.mock.calls[0][0]));
    }
  });
});

describe('both layers use the shared module', () => {
  const read = (file) => fs.readFileSync(require.resolve(`../src/${file}`), 'utf8');

  it.each(['server.js', 'config/socket.js'])('%s builds no allowlist of its own', (file) => {
    const source = read(file);

    expect(source).toContain('createOriginChecker');
    expect(source).not.toMatch(/const allowedOrigins = \[/u);
  });

  it('leaves the production host in exactly one place', () => {
    expect(read('server.js')).not.toContain(VERCEL);
    expect(read('config/socket.js')).not.toContain(VERCEL);
    expect(read('config/allowedOrigins.js')).toContain(VERCEL);
  });
});
