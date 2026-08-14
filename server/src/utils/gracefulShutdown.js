/**
 * Process lifecycle: shutdown on a signal, and a diagnosable exit on an
 * unhandled failure.
 *
 * `grep -rn "process.on" server/src/` previously matched nothing. That meant:
 *
 * - Node 18+ defaults to `--unhandled-rejections=throw`, so one rejected
 *   promise nobody awaited terminated the process with a bare stack trace on
 *   stderr and nothing else. On Render that reads as an unexplained restart.
 * - SIGTERM took its default action, so every deploy and scale-down dropped
 *   in-flight requests, severed the Mongo connection without close(), and cut
 *   Socket.IO clients off abruptly — clients that then reconnect immediately,
 *   all at once, against the replacement instance.
 */

// How long the shutdown steps get before the process exits anyway. Render's
// SIGKILL follows SIGTERM after 30s, so this stays well inside that.
const SHUTDOWN_TIMEOUT_MS = 10000;

/**
 * Build the shutdown routine.
 *
 * Idempotent: a second signal while the first is still draining is ignored
 * rather than starting a second teardown over the same handles.
 */
const createShutdownHandler = ({
  server,
  closeSocket,
  disconnectDB,
  logger = console,
  timeoutMs = SHUTDOWN_TIMEOUT_MS,
  exit = (code) => process.exit(code),
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
}) => {
  let shuttingDown = false;

  return async (reason, exitCode = 0) => {
    if (shuttingDown) {
      logger.warn(`   ⏳ Shutdown already in progress, ignoring ${reason}.`);
      return;
    }
    shuttingDown = true;

    logger.log(`\n🛑 ${reason} received — shutting down gracefully...`);

    // A handle that never settles must not hold the process open forever. This
    // fires regardless of where the steps below get stuck.
    const timer = setTimeoutFn(() => {
      logger.error(`   ⚠️  Shutdown did not finish within ${timeoutMs}ms. Exiting anyway.`);
      exit(exitCode || 1);
    }, timeoutMs);

    // Don't let the timer itself keep the event loop alive once everything
    // else has finished. (unref exists on a Node timer, not on a test double.)
    if (typeof timer?.unref === 'function') timer.unref();

    // Ordered deliberately: stop taking new work, then close the transports
    // clients hold open, then release the database.
    const steps = [
      ['HTTP server', () => new Promise((resolve) => {
        if (!server?.close) return resolve();
        return server.close(resolve);
      })],
      ['Socket.IO', () => closeSocket?.()],
      ['MongoDB', () => disconnectDB?.(logger)],
    ];

    for (const [name, step] of steps) {
      try {
        await step();
        logger.log(`   ✅ ${name} closed.`);
      } catch (error) {
        // Keep going. One step failing shouldn't strand the others.
        logger.error(`   ❌ Failed to close ${name}: ${error.message}`);
      }
    }

    clearTimeoutFn(timer);
    logger.log('   👋 Shutdown complete.\n');
    exit(exitCode);
  };
};

/**
 * Wire the handler to the signals and to the two failure events.
 *
 * Returns an unregister function so a test can attach and detach without
 * leaking listeners across cases.
 */
const registerProcessHandlers = ({
  shutdown,
  logger = console,
  proc = process,
}) => {
  const onSigterm = () => shutdown('SIGTERM', 0);
  const onSigint = () => shutdown('SIGINT', 0);

  const onUnhandledRejection = (reason) => {
    // Logged properly before exiting, which is the whole point: previously
    // this killed the process with no context at all.
    logger.error('❌ Unhandled promise rejection:', reason instanceof Error ? reason.stack : reason);
    shutdown('unhandledRejection', 1);
  };

  const onUncaughtException = (error) => {
    logger.error('❌ Uncaught exception:', error?.stack || error);
    // The process is in an undefined state after this, so the shutdown is a
    // best-effort flush on the way out rather than a real drain.
    shutdown('uncaughtException', 1);
  };

  proc.on('SIGTERM', onSigterm);
  proc.on('SIGINT', onSigint);
  proc.on('unhandledRejection', onUnhandledRejection);
  proc.on('uncaughtException', onUncaughtException);

  return () => {
    proc.off('SIGTERM', onSigterm);
    proc.off('SIGINT', onSigint);
    proc.off('unhandledRejection', onUnhandledRejection);
    proc.off('uncaughtException', onUncaughtException);
  };
};

/**
 * Node's keep-alive timeout defaults to 5s. When a proxy in front holds
 * connections open longer than that, the server can close one at the exact
 * moment the proxy sends a request down it, which the proxy reports as a 502.
 * The fix is to outlive the proxy, and to keep headersTimeout above
 * keepAliveTimeout so a slow-header client is still caught.
 */
const applyKeepAliveTimeouts = (server, { keepAlive = 65000, headers = 66000 } = {}) => {
  if (!server) return;

  server.keepAliveTimeout = keepAlive;
  server.headersTimeout = headers;
};

module.exports = {
  SHUTDOWN_TIMEOUT_MS,
  createShutdownHandler,
  registerProcessHandlers,
  applyKeepAliveTimeouts,
};
