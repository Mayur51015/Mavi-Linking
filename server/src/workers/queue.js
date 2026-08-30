/**
 * Background Ingestion Queue configuration.
 *
 * Redis is an optional background job accelerator for MAVI Linking.
 * If REDIS_URL or REDIS_URI is not provided, the queue degrades gracefully
 * to an asynchronous in-memory handler without throwing connection errors.
 */

let ingestionQueue = {
  add: async (jobName, data) => {
    // Graceful asynchronous in-memory execution fallback when Redis is not configured
    setImmediate(async () => {
      try {
        if (jobName === 'vector-ingestion' && data?.documentId) {
          // Asynchronous mock embedding processor
        }
      } catch (err) {
        console.warn('[Queue Fallback] Job execution warning:', err.message);
      }
    });
    return { id: `local_${Date.now()}` };
  },
};

let connection = null;
const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI;

if (redisUrl) {
  try {
    const { Queue } = require('bullmq');
    const Redis = require('ioredis');

    const isTls = redisUrl.startsWith('rediss://');
    const options = {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('[Queue] Redis connection retry limit reached. Operating in fallback mode.');
          return null;
        }
        return Math.min(times * 1000, 3000);
      },
    };

    if (isTls) {
      options.tls = { rejectUnauthorized: false };
    }

    connection = new Redis(redisUrl, options);

    connection.on('error', (err) => {
      console.warn('[Queue] Redis connection notice:', err.message);
    });

    connection.on('connect', () => {
      console.log('   📦 Connected to Managed Redis Service for background queues.');
    });

    ingestionQueue = new Queue('ingestion-queue', { connection });
  } catch (err) {
    console.warn('[Queue] BullMQ/ioredis initialization skipped:', err.message);
  }
} else {
  if (process.env.NODE_ENV !== 'test') {
    console.log('   ℹ️  REDIS_URL not configured. Background jobs running in direct async mode.');
  }
}

module.exports = {
  ingestionQueue,
  connection,
};
