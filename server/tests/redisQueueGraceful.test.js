describe('Redis & Queue Graceful Degradation Suite', () => {
  const originalEnv = process.env.REDIS_URL;

  afterEach(() => {
    process.env.REDIS_URL = originalEnv;
    jest.resetModules();
  });

  test('queue operates gracefully without REDIS_URL and does not throw ECONNREFUSED', async () => {
    delete process.env.REDIS_URL;
    delete process.env.REDIS_URI;

    const { ingestionQueue, connection } = require('../src/workers/queue');
    const { ingestionWorker } = require('../src/workers/worker');

    expect(connection).toBeNull();
    expect(ingestionWorker).toBeNull();

    // Verify adding jobs works gracefully
    const result = await ingestionQueue.add('vector-ingestion', { documentId: 'doc_123' });
    expect(result).toBeDefined();
    expect(result.id).toContain('local_');
  });
});
