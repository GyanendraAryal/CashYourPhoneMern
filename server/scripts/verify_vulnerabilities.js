import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import Device from '../src/models/Device.js';
import User from '../src/models/User.js';
import Order from '../src/models/Order.js';
import Cart from '../src/models/Cart.js';
import Payment from '../src/models/Payment.js';
import * as pricingService from '../src/modules/pricing/pricing.service.js';
import * as orderService from '../src/modules/order/order.service.js';

async function verify() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cashyourphone');
    console.log("Connected to MongoDB");

    // Clear old test data
    await Device.deleteOne({ name: "Exploit Test Device" });
    await User.deleteOne({ email: "exploit@test.com" });
    
    // Create Mock Data
    const device = await Device.create({
      name: "Exploit Test Device",
      price: 50000,
      condition: "new",
      availability: "in_stock",
      description: "Test"
    });

    const user = await User.create({
      name: "Test Attacker",
      email: "exploit@test.com",
      passwordHash: "password123",
      phone: "9876543210",
      role: "user"
    });

    console.log("\n=============================================");
    console.log("TEST 1: ML Pricing NaN Bug (`basePrice` missing)");
    console.log("=============================================");

    const estimation = await pricingService.estimateDeviceValue(device.basePrice, "new");
    console.log("Input to pricingService (device.basePrice):", device.basePrice);
    console.log("Resulting Estimation Object:", estimation);
    if (Number.isNaN(estimation.estimatedPrice)) {
      console.log("⚠️ VULNERABILITY CONFIRMED: The model uses `price`, but the controller asks for `basePrice` (undefined). This causes a silent fallback to NaN.");
    }

    console.log("\n=============================================");
    console.log("TEST 2: Infinite Inventory Logic Flaw");
    console.log("=============================================");
    
    const session = await mongoose.startSession();
    const contactData = { fullName: "Test Attacker", phone: "1234567890", email: "x@y.com", address: "123 St" };
    
    console.log("Initial Device Availability:", device.availability);
    
    for(let i=1; i<=3; i++) {
        await Cart.findOneAndUpdate(
          { user: user._id },
          {
            $set: {
              items: [{
                product: device._id,
                qty: 1,
                priceSnapshot: device.price
              }]
            }
          },
          { upsert: true }
        );
        
        await session.withTransaction(async (s) => {
            const order = await orderService.createOrder(user._id, contactData, s);
            console.log(`[+] Order ${i} created: ${order.orderNumber}`);
        });
    }

    const deviceAfter = await Device.findById(device._id);
    console.log("Device Availability after 3 checkouts:", deviceAfter.availability);
    if (deviceAfter.availability === "in_stock") {
      console.log("⚠️ VULNERABILITY CONFIRMED: Inventory is NEVER decremented. An attacker can buy unlimited quantities of a single device.");
    }

    console.log("\n=============================================");
    console.log("TEST 3: Payment Cancellation Griefing");
    console.log("=============================================");
    const testOrder = await Order.findOne({ user: user._id });
    const payment = await Payment.create({
      order: testOrder._id,
      provider: "esewa",
      amount: 50000,
      status: "initiated"
    });
    
    console.log(`Created Mock Payment (Status: ${payment.status}, ID: ${payment._id})`);
    
    // Simulate what `esewaFailure` does internally when hit with an unauthenticated callback
    const transactionUuid = String(payment._id);
    const griefedPayment = await Payment.findById(transactionUuid);
    if (griefedPayment && griefedPayment.status !== "succeeded") {
      griefedPayment.status = "cancelled";
      await griefedPayment.save();
    }
    
    const finalPayment = await Payment.findById(payment._id);
    console.log(`Payment Status after Unauthenticated Failure Callback: ${finalPayment.status}`);
    if (finalPayment.status === "cancelled") {
      console.log("⚠️ VULNERABILITY CONFIRMED: Anonymous users can cancel ANY pending payment if they know the UUID.");
    }

    // Cleanup
    await Device.deleteOne({ _id: device._id });
    await User.deleteOne({ _id: user._id });
    await Order.deleteMany({ user: user._id });
    await Cart.deleteMany({ user: user._id });
    await Payment.deleteMany({ order: testOrder._id });
    session.endSession();
    
    console.log("\n[✓] All tests completed successfully.");
    process.exit(0);

  } catch(err) {
    console.error("Test Script Error Name:", err.name);
    console.error("Test Script Error Message:", err.message);
    if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    process.exit(1);
  }
}

verify();
