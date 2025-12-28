/**
 * Production-safe MongoDB data repair script
 * Fixes corrupted availability fields that were stored as strings
 * 
 * Usage: node scripts/repairAvailabilityData.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentorick');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function repairAvailabilityData() {
  try {
    console.log('🔍 Starting availability data repair...');
    
    const db = mongoose.connection.db;
    const collection = db.collection('mentorprofiles');
    
    // Find documents with corrupted availability (stored as string)
    const corruptedDocs = await collection.find({
      $or: [
        { availability: { $type: "string" } }, // Stored as string
        { availability: { $exists: false } },  // Missing entirely
        { 
          $and: [
            { availability: { $exists: true } },
            { "availability.weekly": { $exists: false } }
          ]
        } // Exists but malformed
      ]
    }).toArray();
    
    console.log(`📊 Found ${corruptedDocs.length} documents with corrupted availability`);
    
    if (corruptedDocs.length === 0) {
      console.log('✅ No corrupted data found. All documents are healthy.');
      return;
    }
    
    // Repair each corrupted document
    let repairedCount = 0;
    
    for (const doc of corruptedDocs) {
      const originalAvailability = doc.availability;
      
      console.log(`🔧 Repairing document ${doc._id}...`);
      console.log(`   Original availability type: ${typeof originalAvailability}`);
      console.log(`   Original availability value: ${JSON.stringify(originalAvailability)}`);
      
      // Replace with proper structure
      const result = await collection.updateOne(
        { _id: doc._id },
        {
          $set: {
            availability: {
              weekly: [],
              specificDates: [],
              unavailability: []
            }
          }
        }
      );
      
      if (result.modifiedCount === 1) {
        repairedCount++;
        console.log(`   ✅ Successfully repaired document ${doc._id}`);
      } else {
        console.log(`   ⚠️  Failed to repair document ${doc._id}`);
      }
    }
    
    console.log('\\n📈 Repair Summary:');
    console.log(`   Total corrupted documents found: ${corruptedDocs.length}`);
    console.log(`   Successfully repaired: ${repairedCount}`);
    console.log(`   Failed to repair: ${corruptedDocs.length - repairedCount}`);
    
    // Verify the repair
    console.log('\\n🔍 Verifying repair...');
    
    const verifyHealthy = await collection.countDocuments({
      "availability.weekly": { $exists: true },
      "availability.specificDates": { $exists: true },
      "availability.unavailability": { $exists: true }
    });
    
    const verifyCorrupted = await collection.countDocuments({
      $or: [
        { availability: { $type: "string" } },
        { 
          $and: [
            { availability: { $exists: true } },
            { "availability.weekly": { $exists: false } }
          ]
        }
      ]
    });
    
    console.log(`   Documents with healthy availability: ${verifyHealthy}`);
    console.log(`   Documents still corrupted: ${verifyCorrupted}`);
    
    if (verifyCorrupted === 0) {
      console.log('\\n🎉 All availability data has been successfully repaired!');
    } else {
      console.log('\\n⚠️  Some documents still have corrupted availability. Manual intervention may be required.');
    }
    
  } catch (error) {
    console.error('❌ Repair failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await repairAvailabilityData();
    console.log('\\n✅ Repair script completed successfully');
  } catch (error) {
    console.error('❌ Repair script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { repairAvailabilityData };