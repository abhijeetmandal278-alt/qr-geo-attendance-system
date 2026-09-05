const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');

const startServer = async () => {
  // Attempt MongoDB connection (non-blocking if it fails)
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`\n🚀 Attendify server running in ${env.NODE_ENV} mode`);
    console.log(`   Local:  http://localhost:${env.PORT}`);
    console.log(`   Health: http://localhost:${env.PORT}/api/health\n`);
  });
};

startServer();
