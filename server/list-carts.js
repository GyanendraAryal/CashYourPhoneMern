import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Cart from './src/models/Cart.js';

dotenv.config();

async function listCarts() {
  await mongoose.connect(process.env.MONGO_URI);
  const carts = await Cart.find({ 'items.0': { $exists: true } }).lean();
  console.log('--- NON-EMPTY CARTS ---');
  if (carts.length === 0) {
    console.log('No non-empty carts found.');
  } else {
    carts.forEach((c, idx) => {
      console.log(`${idx + 1}. User: ${c.user}, Items: ${c.items.length}`);
    });
  }
  process.exit(0);
}

listCarts();
