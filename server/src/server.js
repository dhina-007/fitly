const app = require('./app');
const { connectDatabase } = require('./config/database');
const { ensureCommunitySeedData } = require('./services/communityProgress.service');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDatabase();
    await ensureCommunitySeedData();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
