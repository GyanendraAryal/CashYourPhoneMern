import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Device from './src/models/Device.js';
import HeroSlide from './src/models/HeroSlide.js';

dotenv.config();

async function cleanup() {
  await mongoose.connect(process.env.MONGO_URI);
  
  console.log('--- CLEANING DEVICES ---');
  const devices = await Device.find({
    $or: [
      { thumbnail: { $regex: '\[object Object\]' } },
      { images: { $regex: '\[object Object\]' } }
    ]
  });

  for (const d of devices) {
    let dirty = false;
    if (d.thumbnail && d.thumbnail.includes('[object Object]')) {
      d.thumbnail = 'https://placehold.co/400x400?text=Fix+Thumbnail';
      dirty = true;
    }
    if (Array.isArray(d.images)) {
      d.images = d.images.filter(img => !img.includes('[object Object]'));
      if (d.images.length === 0) {
        d.images = ['https://placehold.co/800x800?text=Fix+Gallery'];
      }
      dirty = true;
    }
    if (dirty) {
      console.log(`Fixing device: ${d.name}`);
      await d.save();
    }
  }

  console.log('✅ Cleanup complete.');
  process.exit(0);
}

cleanup();
