/**
 * Deletes all app data except users and Google OAuth tokens.
 * Usage: node scripts/resetAppData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const KEEP_COLLECTIONS = new Set(['users', 'googletokens']);

async function resetAppData() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mentorick';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  for (const { name } of collections) {
    if (KEEP_COLLECTIONS.has(name)) {
      const count = await db.collection(name).countDocuments();
      console.log(`KEEP  ${name} (${count} documents)`);
      continue;
    }

    const result = await db.collection(name).deleteMany({});
    console.log(`DELETE ${name} (${result.deletedCount} documents removed)`);
  }

  await mongoose.disconnect();
  console.log('Done. Users and Google tokens preserved.');
}

resetAppData().catch((error) => {
  console.error('Reset failed:', error);
  process.exit(1);
});
