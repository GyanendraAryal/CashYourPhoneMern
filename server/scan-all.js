import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Device from './src/models/Device.js';
import Review from './src/models/Review.js';

dotenv.config();

async function scan() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('--- SCANNING DEVICES ---');
  const devices = await Device.find({
    $or: [
      { thumbnail: { $regex: '\[object Object\]' } },
      { images: { $regex: '\[object Object\]' } }
    ]
  });
  console.log(`Found ${devices.length} corrupted devices.`);
  devices.forEach(d => console.log(`- Device: ${d.name} (${d._id})`));

  console.log('\n--- SCANNING REVIEWS ---');
  const reviews = await Review.find({
    avatar: { $regex: '\[object Object\]' }
  });
  console.log(`Found ${reviews.length} corrupted reviews.`);
  reviews.forEach(r => console.log(`- Review from: ${r.name} (${r._id})`));

  process.exit(0);
}

scan();
