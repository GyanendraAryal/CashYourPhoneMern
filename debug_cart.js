const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

async function debugCart() {
  try {
    const configPath = 'c:/Users/Gyanendra/Desktop/CashYourPhoneMern-main/server/.env';
    dotenv.config({ path: configPath });
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Manually register models to avoid module complexity
    const Schema = mongoose.Schema;
    const Cart = mongoose.models.Cart || mongoose.model('Cart', new Schema({
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      items: [{ product: { type: Schema.Types.ObjectId, ref: 'Device' }, qty: Number }]
    }));

    const Order = mongoose.models.Order || mongoose.model('Order', new Schema({
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      status: String,
      items: Array
    }));

    const userId = '69c9322fcd7219410b2e15dd';
    
    console.log('Searching for User ID:', userId);

    const carts = await Cart.find({ user: userId });
    console.log('Found carts:', carts.length);
    for (const c of carts) {
      console.log('Cart _id:', c._id);
      console.log('Cart Items Length:', c.items?.length);
    }

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(1);
    console.log('Found orders:', orders.length);
    for (const o of orders) {
      console.log('Order status:', o.status);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debugCart();
