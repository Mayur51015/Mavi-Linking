const { Queue } = require('bullmq');
const Redis = require('ioredis');

// Default to a local Redis instance if REDIS_URL is not set
const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

// Create the ingestion queue
const ingestionQueue = new Queue('ingestion-queue', { connection });

module.exports = {
  ingestionQueue,
  connection
};
