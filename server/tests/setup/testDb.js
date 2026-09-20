const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Connects to the in-memory MongoDB instance or uses an existing MONGODB_URI.
 */
const connect = async () => {
  if (!mongoServer && !process.env.MONGODB_URI) {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
  }

  const uri = process.env.MONGODB_URI || (mongoServer && mongoServer.getUri());

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
  return uri;
};

/**
 * Disconnects mongoose and stops the in-memory MongoDB instance.
 */
const disconnect = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

/**
 * Clears all collections in the test database.
 */
const clearDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};

module.exports = {
  connect,
  disconnect,
  clearDatabase,
};
