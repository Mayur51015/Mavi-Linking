const mongoose = require('mongoose');

/**
 * MongoDB connection, with the retry the previous docstring described but did
 * not implement.
 *
 * The old version did one `mongoose.connect()` and `process.exit(1)` on
 * failure. With `serverSelectionTimeoutMS: 5000`, a five-second blip during a
 * deploy — or simply the container starting a moment before the database is
 * reachable — was enough to kill it. The platform restarts it, it fails again,
 * and a transient condition becomes a failed deploy.
 */

const DEFAULT_MAX_ATTEMPTS = 5;
const BASE_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 15000;

/**
 * Exponential backoff, capped: 1s, 2s, 4s, 8s, then 15s.
 */
const retryDelay = (attempt, baseDelay = BASE_RETRY_DELAY_MS) =>
  Math.min(baseDelay * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let listenersRegistered = false;

/**
 * Register connection listeners once, before the first connect attempt.
 *
 * Previously these were attached *after* `await mongoose.connect()` resolved,
 * so they could not observe a failure during the initial connection — the case
 * where knowing about it matters most.
 */
const registerConnectionListeners = (logger = console) => {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on('error', (err) => {
    logger.error(`❌ MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️  MongoDB disconnected. Attempting reconnection...');
  });

  mongoose.connection.on('reconnected', () => {
    logger.log('🔄 MongoDB reconnected successfully');
  });
};

/**
 * Connect, retrying transient failures with backoff.
 *
 * Throws after the last attempt rather than calling process.exit itself. The
 * caller owns the decision to stop, and a function that exits the process
 * cannot be tested.
 */
const connectDB = async ({
  maxAttempts = Number.parseInt(process.env.MONGODB_MAX_CONNECT_ATTEMPTS, 10) || DEFAULT_MAX_ATTEMPTS,
  baseDelay = BASE_RETRY_DELAY_MS,
  logger = console,
  connect = (uri, options) => mongoose.connect(uri, options),
  wait = sleep,
} = {}) => {
  registerConnectionListeners(logger);

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const conn = await connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      logger.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) break;

      const delay = retryDelay(attempt, baseDelay);
      logger.warn(
        `⚠️  MongoDB connection attempt ${attempt}/${maxAttempts} failed (${error.message}). ` +
          `Retrying in ${delay}ms...`
      );
      await wait(delay);
    }
  }

  throw new Error(
    `MongoDB connection failed after ${maxAttempts} attempts: ${lastError?.message || 'unknown error'}`
  );
};

/**
 * Close the connection during shutdown. Never throws — a shutdown step that
 * can throw is a shutdown that hangs.
 */
const disconnectDB = async (logger = console) => {
  try {
    await mongoose.connection.close(false);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to close the MongoDB connection: ${error.message}`);
    return false;
  }
};

// Default export unchanged so existing `require('./config/db')` callers keep
// working; the named exports are for the shutdown path and the tests.
module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.disconnectDB = disconnectDB;
module.exports.retryDelay = retryDelay;
module.exports.DEFAULT_MAX_ATTEMPTS = DEFAULT_MAX_ATTEMPTS;
module.exports.MAX_RETRY_DELAY_MS = MAX_RETRY_DELAY_MS;
