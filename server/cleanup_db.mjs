import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const DeviceSchema = new mongoose.Schema({ thumbnail: String, images: [String] }, { strict: false });
const Device = mongoose.model('Device', DeviceSchema);

const HeroSlideSchema = new mongoose.Schema({ image: String, imageDesktop: String, imageMobile: String }, { strict: false });
const HeroSlide = mongoose.model('HeroSlide', HeroSlideSchema);

async function cleanup() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // 1. Devices
  const corruptedDevices = await Device.find({ 
    $or: [{ thumbnail: /\[object Object\]/ }, { images: /\[object Object\]/ }]
  });
  console.log(`Found ${corruptedDevices.length} corrupted devices`);
  for (const d of corruptedDevices) {
    if (d.thumbnail?.includes('[object Object]')) d.thumbnail = '';
    d.images = d.images.filter(img => !img.includes('[object Object]'));
    await d.save();
    console.log(`Cleaned device: ${d._id}`);
  }

  // 2. HeroSlides
  const corruptedSlides = await HeroSlide.find({
    $or: [
      { image: /\[object Object\]/ },
      { imageDesktop: /\[object Object\]/ },
      { imageMobile: /\[object Object\]/ }
    ]
  });
  console.log(`Found ${corruptedSlides.length} corrupted slides`);
  for (const s of corruptedSlides) {
    if (s.image?.includes('[object Object]')) s.image = '';
    if (s.imageDesktop?.includes('[object Object]')) s.imageDesktop = '';
    if (s.imageMobile?.includes('[object Object]')) s.imageMobile = '';
    await s.save();
    console.log(`Cleaned slide: ${s._id}`);
  }

  await mongoose.disconnect();
}
cleanup();
