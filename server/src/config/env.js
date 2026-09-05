const dotenv = require('dotenv');
const path = require('path');

// Load .env file from the server root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/attendify',
  JWT_SECRET: process.env.JWT_SECRET || 'default_dev_secret',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};

module.exports = env;
