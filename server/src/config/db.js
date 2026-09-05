const mongoose = require('mongoose');
const env = require('./env');

/**
 * Connect to MongoDB.
 * Gracefully handles connection failures so the server can still
 * start without a running MongoDB instance during development.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.warn('⚠️  Server will continue without database connectivity.');
    console.warn('   Make sure MongoDB is running and MONGODB_URI is correct.');
  }
};

module.exports = connectDB;
