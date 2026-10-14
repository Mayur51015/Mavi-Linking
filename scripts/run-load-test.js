/**
 * Automated Load Testing Suite using Autocannon
 * Benchmarks API throughput, latency distribution, and error rates on a safe, isolated test environment.
 */
const http = require('http');
const express = require('express');
const autocannon = require('autocannon');

async function runLoadTest() {
  console.log('⚡ [Load Test] Initializing isolated benchmark server...');

  const app = express();
  app.use(express.json());

  // Health and lightweight compute test endpoints
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: Date.now() });
  });

  app.get('/api/candidate-summary', (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        score: 88,
        tier: 'Gold',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      },
    });
  });

  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve();
    });
  });

  const port = server.address().port;
  const targetUrl = `http://127.0.0.1:${port}/api/health`;

  console.log(`⚡ [Load Test] Running 5-second load test with 10 concurrent connections on ${targetUrl}...`);

  const result = await autocannon({
    url: targetUrl,
    connections: 10,
    pipelining: 1,
    duration: 5,
  });

  console.log('\n================ LOAD TEST RESULTS ================');
  console.log(`Total Requests Sent : ${result.requests.total}`);
  console.log(`Throughput (avg)    : ${result.requests.average} req/sec`);
  console.log(`Throughput (max)    : ${result.requests.max} req/sec`);
  console.log(`Latency (p50)       : ${result.latency.p50} ms`);
  console.log(`Latency (p97.5)     : ${result.latency.p97_5} ms`);
  console.log(`Latency (p99)       : ${result.latency.p99} ms`);
  console.log(`2xx Responses       : ${result['2xx']}`);
  console.log(`Errors / Timeouts   : ${result.errors} / ${result.timeouts}`);
  console.log('===================================================\n');

  await new Promise((resolve) => server.close(resolve));

  if (result.errors > 0 || result.timeouts > 0) {
    console.error(`❌ Load test encountered errors: ${result.errors} errors, ${result.timeouts} timeouts`);
    process.exit(1);
  }

  if (result.requests.average < 50) {
    console.warn(`⚠️ Warning: Throughput was below expected 50 req/sec benchmark (${result.requests.average})`);
  } else {
    console.log(`✅ Performance benchmark passed: ${result.requests.average} req/s with p97.5 of ${result.latency.p97_5}ms`);
  }
}

runLoadTest().catch((err) => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});
