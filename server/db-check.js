import mongoose from 'mongoose';
import dotenv from 'dotenv';
import HeroSlide from './src/models/HeroSlide.js';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const slides = await HeroSlide.find({}).lean();
  console.log('--- SLIDES IN DB ---');
  slides.forEach(s => {
    console.log(`Title: ${s.title}`);
    console.log(`  image: ${s.image}`);
    console.log(`  imageDesktop: ${s.imageDesktop}`);
    console.log(`  imageMobile: ${s.imageMobile}`);
  });
  process.exit(0);
}

check();
