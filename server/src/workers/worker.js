/**
 * Background Ingestion Worker.
 *
 * Listens on the BullMQ queue when a valid Redis connection exists.
 */

let ingestionWorker = null;

const { connection } = require('./queue');

if (connection) {
  try {
    const { Worker } = require('bullmq');

    // Vector embedding generation or heavy processing
    const processVectorIngestion = async (job) => {
      console.log(`[Worker] Starting vector ingestion for document: ${job.data.documentId}`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log(`[Worker] Completed vector ingestion for document: ${job.data.documentId}`);
      return { success: true, documentId: job.data.documentId };
    };

    ingestionWorker = new Worker('ingestion-queue', processVectorIngestion, {
      connection,
      concurrency: 5,
    });

    ingestionWorker.on('completed', (job) => {
      console.log(`[Worker] Job ${job.id} completed successfully`);
    });

    ingestionWorker.on('failed', (job, err) => {
      console.error(`[Worker] Job ${job?.id} failed:`, err.message);
    });

    ingestionWorker.on('error', (err) => {
      console.warn('[Worker] BullMQ worker notice:', err.message);
    });
  } catch (err) {
    console.warn('[Worker] BullMQ queue worker initialization skipped:', err.message);
  }
}

module.exports = {
  ingestionWorker,
};
