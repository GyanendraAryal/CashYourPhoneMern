import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Cart from './src/models/Cart.js';

dotenv.config();

async function checkCart() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: /gyanendraaryal4@gmail.com/i }).lean();
  if (!user) {
    console.log('❌ User not found');
    process.exit(1);
  }
  console.log(`User ID: ${user._id}`);
  
  const cart = await Cart.findOne({ user: user._id }).lean();
  if (cart) {
    console.log('--- CART INFO ---');
    console.log(`Items count: ${cart.items.length}`);
    cart.items.forEach((it, i) => {
      console.log(`  ${i+1}. Product: ${it.product}, Qty: ${it.qty}`);
    });
  } else {
    console.log('❌ Cart not found for this user');
  }
  process.exit(0);
}

checkCart();
