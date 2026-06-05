const mongoose = require('mongoose');

// Turn off query buffering so Mongoose fails operations immediately if disconnected
// This allows our resilient fallback engines in controllers to trigger instantly!
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  try {
    let connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxe';
    
    // Proactively check standard cloud Atlas password placeholder
    if (connString.includes('<db_password>')) {
      console.warn('[Database] MONGODB_URI contains unresolved "<db_password>" placeholder. Retrying local fallback first.');
      connString = 'mongodb://127.0.0.1:27017/luxe';
    }
    
    await mongoose.connect(connString, {
      serverSelectionTimeoutMS: 2000 // Quick timeout to fail fast if offline
    });
    console.log(`[Database] MongoDB connected successfully.`);
  } catch (error) {
    console.error(`[Database] MongoDB Atlas connection failed: ${error.message}`);
    
    // Attempt local fallback
    try {
      console.log('[Database] Retrying connection to local fallback MongoDB (127.0.0.1:27017)...');
      await mongoose.connect('mongodb://127.0.0.1:27017/luxe', {
        serverSelectionTimeoutMS: 2000
      });
      console.log(`[Database] Local fallback MongoDB connected successfully.`);
    } catch (fallbackError) {
      console.warn(`[Database] Local fallback connection also failed: ${fallbackError.message}`);
      console.warn('[Database] LUXE is running in 100% resilient mock database fallback mode.');
    }
  }
};

module.exports = connectDB;
