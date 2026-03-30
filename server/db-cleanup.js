import mongoose from 'mongoose';
import dotenv from 'dotenv';
import HeroSlide from './src/models/HeroSlide.js';

dotenv.config();

async function cleanup() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('--- CLEANING UP HERO SLIDES ---');
  
  const slides = await HeroSlide.find({});
  for (const s of slides) {
    let dirty = false;
    
    if (s.image && s.image.includes('[object Object]')) {
      console.log(`Fixing corrupted image for ${s._id}`);
      s.image = 'https://placehold.co/1200x600?text=Fix+Image';
      dirty = true;
    }
    
    if (s.imageDesktop && s.imageDesktop.includes('[object Object]')) {
      s.imageDesktop = 'https://placehold.co/1200x600?text=Fix+Image';
      dirty = true;
    }

    if (s.imageMobile && s.imageMobile.includes('[object Object]')) {
      s.imageMobile = 'https://placehold.co/600x1200?text=Fix+Mobile+Image';
      dirty = true;
    }

    if (dirty) await s.save();
  }
  
  console.log('✅ Cleanup complete.');
  process.exit(0);
}

cleanup();
