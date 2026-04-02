const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'server/.env') });

async function findTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find a product with stock
    const Device = require('./server/src/models/Device.js');
    const device = await Device.findOne({ quantity: { $gt: 5 } });
    
    // Find a dummy user
    const User = require('./server/src/models/User.js');
    const user = await User.findOne({ role: 'user' });
    
    console.log('--- TEST DATA ---');
    console.log('DEVICE_ID:', device?._id);
    console.log('DEVICE_NAME:', device?.name);
    console.log('DEVICE_PRICE:', device?.price);
    console.log('USER_ID:', user?._id);
    console.log('USER_EMAIL:', user?.email);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findTestData();
