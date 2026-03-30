import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Cart from './src/models/Cart.js';

dotenv.config();

async function checkCarts() {
  await mongoose.connect(process.env.MONGO_URI);
  const carts = await Cart.find({ 'items.0': { $exists: true } }).lean();
  console.log('--- NON-EMPTY CARTS ---');
  for (const c of carts) {
    const user = await User.findById(c.user).lean();
    console.log(`User: ${user ? user.email : 'Unknown'}, ID: ${c.user}, Items: ${c.items.length}`);
  }
  process.exit(0);
}

checkCarts();
