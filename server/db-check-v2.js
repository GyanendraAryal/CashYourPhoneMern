import mongoose from 'mongoose';
import dotenv from 'dotenv';
import HeroSlide from './src/models/HeroSlide.js';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const slides = await HeroSlide.find({}).lean();
  console.log(JSON.stringify(slides, null, 2));
  process.exit(0);
}

check();
