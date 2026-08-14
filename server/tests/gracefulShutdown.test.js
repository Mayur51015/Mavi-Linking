const { EventEmitter } = require('events');
const fs = require('fs');

const {
  SHUTDOWN_TIMEOUT_MS,
  createShutdownHandler,
  registerProcessHandlers,
  applyKeepAliveTimeouts,
} = require('../src/utils/gracefulShutdown');

const { retryDelay, DEFAULT_MAX_ATTEMPTS, MAX_RETRY_DELAY_MS } = require('../src/config/db');
const connectDB = require('../src/config/db');

const silentLogger = () => ({ log: jest.fn(), warn: jest.fn(), error: jest.fn() });

/** An http.Server stand-in whose close() invokes its callback. */
const buildServer = () => ({ close: jest.fn((cb) => cb()) });

const buildDeps = (overrides = {}) => ({
  server: buildServer(),
  closeSocket: jest.fn().mockResolvedValue(undefined),
  disconnectDB: jest.fn().mockResolvedValue(true),
  logger: silentLogger(),
  exit: jest.fn(),
  // Immediate no-op timer so the watchdog never fires in the happy path.
  setTimeoutFn: jest.fn(() => ({ unref: jest.fn() })),
  clearTimeoutFn: jest.fn(),
  ...overrides,
});

describe('createShutdownHandler', () => {
  it('closes the HTTP server, the socket server and the database', async () => {
    const deps = buildDeps();

    await createShutdownHandler(deps)('SIGTERM');

    expect(deps.server.close).toHaveBeenCalled();
    expect(deps.closeSocket).toHaveBeenCalled();
    expect(deps.disconnectDB).toHaveBeenCalled();
  });

  it('stops accepting new connections before releasing the database', async () => {
    const order = [];
    const deps = buildDeps({
      server: { close: jest.fn((cb) => { order.push('http'); cb(); }) },
      closeSocket: jest.fn(async () => { order.push('socket'); }),
      disconnectDB: jest.fn(async () => { order.push('db'); }),
    });

    await createShutdownHandler(deps)('SIGTERM');

    expect(order).toEqual(['http', 'socket', 'db']);
  });

  it('exits with the code it was given', async () => {
    const deps = buildDeps();

    await createShutdownHandler(deps)('uncaughtException', 1);

    expect(deps.exit).toHaveBeenCalledWith(1);
  });

  it('exits 0 for an ordinary signal', async () => {
    const deps = buildDeps();

    await createShutdownHandler(deps)('SIGTERM');

    expect(deps.exit).toHaveBeenCalledWith(0);
  });

  it('ignores a second signal instead of tearing down twice', async () => {
    const deps = buildDeps();
    const shutdown = createShutdownHandler(deps);

    await shutdown('SIGTERM');
    await shutdown('SIGINT');

    expect(deps.server.close).toHaveBeenCalledTimes(1);
    expect(deps.exit).toHaveBeenCalledTimes(1);
    expect(deps.logger.warn).toHaveBeenCalledWith(expect.stringMatching(/already in progress/u));
  });

  it('continues past a step that throws', async () => {
    const deps = buildDeps({
      closeSocket: jest.fn().mockRejectedValue(new Error('socket already gone')),
    });

    await createShutdownHandler(deps)('SIGTERM');

    // One failure must not strand the database connection.
    expect(deps.disconnectDB).toHaveBeenCalled();
    expect(deps.exit).toHaveBeenCalledWith(0);
    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringMatching(/socket already gone/u));
  });

  it('survives a missing server or socket server', async () => {
    const deps = buildDeps({ server: undefined, closeSocket: undefined });

    await createShutdownHandler(deps)('SIGTERM');

    expect(deps.disconnectDB).toHaveBeenCalled();
    expect(deps.exit).toHaveBeenCalledWith(0);
  });

  it('arms a watchdog so a hung handle cannot hold the process open', async () => {
    const deps = buildDeps();

    await createShutdownHandler(deps)('SIGTERM');

    expect(deps.setTimeoutFn).toHaveBeenCalledWith(expect.any(Function), SHUTDOWN_TIMEOUT_MS);
  });

  it('exits from the watchdog when a step never settles', async () => {
    let fire;
    const deps = buildDeps({
      // Never resolves — the case the watchdog exists for.
      closeSocket: jest.fn(() => new Promise(() => {})),
      setTimeoutFn: jest.fn((fn) => { fire = fn; return { unref: jest.fn() }; }),
    });

    createShutdownHandler(deps)('SIGTERM');
    await Promise.resolve();
    fire();

    expect(deps.exit).toHaveBeenCalledWith(1);
    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringMatching(/did not finish/u));
  });

  it('unrefs the watchdog so it does not itself keep the loop alive', async () => {
    const unref = jest.fn();
    const deps = buildDeps({ setTimeoutFn: jest.fn(() => ({ unref })) });

    await createShutdownHandler(deps)('SIGTERM');

    expect(unref).toHaveBeenCalled();
  });

  it('clears the watchdog once the steps are done', async () => {
    const timer = { unref: jest.fn() };
    const deps = buildDeps({ setTimeoutFn: jest.fn(() => timer) });

    await createShutdownHandler(deps)('SIGTERM');

    expect(deps.clearTimeoutFn).toHaveBeenCalledWith(timer);
  });

  it('finishes inside the platform grace period', () => {
    // Render sends SIGKILL 30s after SIGTERM.
    expect(SHUTDOWN_TIMEOUT_MS).toBeLessThan(30000);
  });
});

describe('registerProcessHandlers', () => {
  const buildProc = () => {
    const proc = new EventEmitter();
    proc.off = proc.removeListener.bind(proc);
    return proc;
  };

  it('shuts down cleanly on SIGTERM and SIGINT', () => {
    const proc = buildProc();
    const shutdown = jest.fn();

    registerProcessHandlers({ shutdown, logger: silentLogger(), proc });

    proc.emit('SIGTERM');
    expect(shutdown).toHaveBeenCalledWith('SIGTERM', 0);

    proc.emit('SIGINT');
    expect(shutdown).toHaveBeenCalledWith('SIGINT', 0);
  });

  it('logs and exits non-zero on an unhandled rejection', () => {
    const proc = buildProc();
    const shutdown = jest.fn();
    const logger = silentLogger();

    registerProcessHandlers({ shutdown, logger, proc });
    proc.emit('unhandledRejection', new Error('mongo write failed'));

    // The regression: this used to kill the process with no log line at all.
    expect(logger.error).toHaveBeenCalledWith(
      '❌ Unhandled promise rejection:',
      expect.stringContaining('mongo write failed')
    );
    expect(shutdown).toHaveBeenCalledWith('unhandledRejection', 1);
  });

  it('logs a non-Error rejection reason as-is', () => {
    const proc = buildProc();
    const logger = silentLogger();

    registerProcessHandlers({ shutdown: jest.fn(), logger, proc });
    proc.emit('unhandledRejection', 'a bare string');

    expect(logger.error).toHaveBeenCalledWith(
      '❌ Unhandled promise rejection:',
      'a bare string'
    );
  });

  it('logs and exits non-zero on an uncaught exception', () => {
    const proc = buildProc();
    const shutdown = jest.fn();
    const logger = silentLogger();

    registerProcessHandlers({ shutdown, logger, proc });
    proc.emit('uncaughtException', new Error('boom'));

    expect(logger.error).toHaveBeenCalledWith('❌ Uncaught exception:', expect.stringContaining('boom'));
    expect(shutdown).toHaveBeenCalledWith('uncaughtException', 1);
  });

  it('returns an unregister that removes every listener', () => {
    const proc = buildProc();
    const shutdown = jest.fn();

    const unregister = registerProcessHandlers({ shutdown, logger: silentLogger(), proc });
    unregister();

    for (const event of ['SIGTERM', 'SIGINT', 'unhandledRejection', 'uncaughtException']) {
      expect(proc.listenerCount(event)).toBe(0);
    }
  });
});

describe('applyKeepAliveTimeouts', () => {
  it('outlives the 5s Node default that produces proxy 502s', () => {
    const server = {};

    applyKeepAliveTimeouts(server);

    expect(server.keepAliveTimeout).toBeGreaterThan(60000);
  });

  it('keeps headersTimeout above keepAliveTimeout', () => {
    const server = {};

    applyKeepAliveTimeouts(server);

    expect(server.headersTimeout).toBeGreaterThan(server.keepAliveTimeout);
  });

  it('accepts overrides', () => {
    const server = {};

    applyKeepAliveTimeouts(server, { keepAlive: 70000, headers: 71000 });

    expect(server).toEqual({ keepAliveTimeout: 70000, headersTimeout: 71000 });
  });

  it('does nothing without a server', () => {
    expect(() => applyKeepAliveTimeouts(undefined)).not.toThrow();
  });
});

describe('connectDB retry', () => {
  const conn = { connection: { host: 'db.example.com' } };

  it('returns on the first attempt when the database is reachable', async () => {
    const connect = jest.fn().mockResolvedValue(conn);

    await expect(connectDB({ connect, logger: silentLogger(), wait: jest.fn() })).resolves.toBe(conn);
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('retries a transient failure instead of exiting', async () => {
    // The regression: a five-second blip during a deploy used to be fatal.
    const connect = jest
      .fn()
      .mockRejectedValueOnce(new Error('server selection timed out'))
      .mockRejectedValueOnce(new Error('server selection timed out'))
      .mockResolvedValue(conn);

    await expect(connectDB({ connect, logger: silentLogger(), wait: jest.fn() })).resolves.toBe(conn);
    expect(connect).toHaveBeenCalledTimes(3);
  });

  it('gives up after the attempt cap and reports the last error', async () => {
    const connect = jest.fn().mockRejectedValue(new Error('bad credentials'));

    await expect(
      connectDB({ connect, maxAttempts: 3, logger: silentLogger(), wait: jest.fn() })
    ).rejects.toThrow(/after 3 attempts: bad credentials/u);

    expect(connect).toHaveBeenCalledTimes(3);
  });

  it('throws rather than calling process.exit itself', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await expect(
      connectDB({
        connect: jest.fn().mockRejectedValue(new Error('nope')),
        maxAttempts: 1,
        logger: silentLogger(),
        wait: jest.fn(),
      })
    ).rejects.toThrow();

    expect(exitSpy).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it('waits between attempts but not after the last one', async () => {
    const wait = jest.fn().mockResolvedValue(undefined);

    await expect(
      connectDB({
        connect: jest.fn().mockRejectedValue(new Error('nope')),
        maxAttempts: 3,
        logger: silentLogger(),
        wait,
      })
    ).rejects.toThrow();

    expect(wait).toHaveBeenCalledTimes(2);
  });

  it('backs off exponentially, capped', () => {
    expect(retryDelay(1, 1000)).toBe(1000);
    expect(retryDelay(2, 1000)).toBe(2000);
    expect(retryDelay(3, 1000)).toBe(4000);
    expect(retryDelay(20, 1000)).toBe(MAX_RETRY_DELAY_MS);
  });

  it('defaults to more than one attempt', () => {
    expect(DEFAULT_MAX_ATTEMPTS).toBeGreaterThan(1);
  });
});

describe('server wiring', () => {
  const serverSource = fs.readFileSync(require.resolve('../src/server.js'), 'utf8');

  it('registers the process handlers', () => {
    expect(serverSource).toContain('registerProcessHandlers');
  });

  it('catches a rejection from startServer, which was called bare', () => {
    expect(serverSource).toMatch(/startServer\(\)\s*\.catch\(/u);
  });

  it('sets the keep-alive timeouts', () => {
    expect(serverSource).toContain('applyKeepAliveTimeouts(server)');
  });
});
