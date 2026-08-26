let ingestionQueue = {
  add: async () => {
    // console.log('[Queue] BullMQ not active, skipped queue job');
  }
};
let connection = null;

try {
  const { Queue } = require('bullmq');
  const Redis = require('ioredis');

  connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

  ingestionQueue = new Queue('ingestion-queue', { connection });
} catch (err) {
  // console.warn('[Queue] BullMQ/ioredis optional package not loaded');
}

module.exports = {
  ingestionQueue,
  connection
};
