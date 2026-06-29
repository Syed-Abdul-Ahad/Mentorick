const mongoose = require('mongoose');

const LEGACY_REVIEW_INDEXES = [
  'session_1_mentee_1',
  'session_1',
];

const syncReviewIndexes = async () => {
  const Review = require('../models/Review');
  const collection = Review.collection;
  const indexes = await collection.indexes();

  for (const indexName of LEGACY_REVIEW_INDEXES) {
    if (indexes.some((index) => index.name === indexName)) {
      await collection.dropIndex(indexName);
      console.log(`🧹 Dropped legacy review index: ${indexName}`);
    }
  }

  await Review.syncIndexes();
  console.log('✅ Review indexes synced');
};

const connectDB = async () => {
  try {
    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_TEST_URI 
      : process.env.MONGODB_URI;

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    await syncReviewIndexes();

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.syncReviewIndexes = syncReviewIndexes;
