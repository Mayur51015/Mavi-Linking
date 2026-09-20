const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Set default JWT secret for test environments if missing
process.env.JWT_SECRET = process.env.JWT_SECRET || 'ci-test-secret-key-mavi-linking-2026';
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  // Increase timeout for in-memory server startup & DB operations
  if (mongoose.connection.readyState === 0) {
    if (!process.env.MONGODB_URI) {
      mongoServer = await MongoMemoryServer.create();
      process.env.MONGODB_URI = mongoServer.getUri();
    }
    await mongoose.connect(process.env.MONGODB_URI);
  }
}, 60000);

afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (err) {
    // ignore disconnect error during teardown
  }
  if (mongoServer) {
    try {
      await mongoServer.stop();
    } catch (err) {
      // ignore stop error
    }
    mongoServer = null;
  }
}, 30000);
