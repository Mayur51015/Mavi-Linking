let ingestionWorker = null;

try {
  const { Worker } = require('bullmq');
  const { connection } = require('./queue');

  // Mock vector embedding generation or heavy processing
  const processVectorIngestion = async (job) => {
    console.log(`[Worker] Starting vector ingestion for document: ${job.data.documentId}`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log(`[Worker] Completed vector ingestion for document: ${job.data.documentId}`);
    return { success: true, documentId: job.data.documentId };
  };

  ingestionWorker = new Worker('ingestion-queue', processVectorIngestion, {
    connection,
    concurrency: 5,
  });

  ingestionWorker.on('completed', (job) => {
    console.log(`Job with id ${job.id} has been completed`);
  });

  ingestionWorker.on('failed', (job, err) => {
    console.error(`Job with id ${job.id} has failed with ${err.message}`);
  });
} catch (err) {
  // Background worker optional if bullmq/redis not configured
  // console.warn('[Worker] BullMQ queue worker not initialized:', err.message);
}

module.exports = {
  ingestionWorker
};
