const mongoose = require('mongoose');

let lastConnectionError = null;
let isConnecting = false;

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    lastConnectionError = 'MONGODB_URI environment variable is missing on Render. Please add MONGODB_URI in Render Dashboard > Environment.';
    console.error('❌ ' + lastConnectionError);
    return;
  }

  if (mongoose.connection.readyState === 1 || isConnecting) {
    return;
  }

  isConnecting = true;
  try {
    const maskedUri = uri.replace(/\/\/(.*):(.*)@/, '//***:***@');
    console.log(`🔌 Connecting to MongoDB Atlas (${maskedUri})...`);

    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // 30s timeout for cloud cold starts
      socketTimeoutMS: 45000,
    });
    lastConnectionError = null;
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    lastConnectionError = err.message;
    console.error('❌ MongoDB connection error:', err.message);
  } finally {
    isConnecting = false;
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Retrying in 5 seconds...');
  setTimeout(() => {
    connectDatabase().catch(() => {});
  }, 5000);
});

module.exports = {
  connectDatabase,
  getLastConnectionError: () => lastConnectionError,
};

