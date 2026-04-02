import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function findTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find a product with stock
    const Device = (await import('./src/models/Device.js')).default;
    const device = await Device.findOne({ quantity: { $gt: 5 } });
    
    // Find a dummy user
    const User = (await import('./src/models/User.js')).default;
    const user = await User.findOne({ role: 'user' });
    
    if (device && user) {
      console.log('--- TEST DATA ---');
      console.log('DEVICE_ID:', device._id);
      console.log('DEVICE_NAME:', device.name);
      console.log('DEVICE_PRICE:', device.price);
      console.log('USER_ID:', user._id);
      console.log('USER_EMAIL:', user.email);
    } else {
      console.log('No suitable test data found.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findTestData();
