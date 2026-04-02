import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debug() {
  try {
    dotenv.config({ path: path.join(__dirname, ".env") });
    const uri = process.env.MONGO_URI;
    
    if (!uri) {
      console.error("MONGO_URI not found in .env");
      process.exit(1);
    }
    
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    const userId = "69c9322fcd7219410b2e15dd";
    
    // Define minimal schemas to avoid importing complex model files
    const cartSchema = new mongoose.Schema({
      user: mongoose.Schema.Types.ObjectId,
      items: [{}]
    });
    const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);

    const userSchema = new mongoose.Schema({ email: String });
    const User = mongoose.models.User || mongoose.model("User", userSchema);

    const user = await User.findById(userId);
    console.log("--- USER ---");
    if (!user) {
      console.log("User not found!");
    } else {
      console.log("Email:", user.email);
    }

    const cart = await Cart.findOne({ user: userId });
    console.log("--- CART ---");
    if (!cart) {
      console.log("No cart found for this user ID.");
    } else {
      console.log("Cart ID:", cart._id);
      console.log("Items Count:", cart.items?.length || 0);
      console.log("Items:", JSON.stringify(cart.items, null, 2));
    }

    const allCarts = await Cart.find({});
    console.log("--- GLOBAL STATS ---");
    console.log("Total Carts in DB:", allCarts.length);

    process.exit(0);
  } catch (err) {
    console.error("❌ Debug failed:", err);
    process.exit(1);
  }
}

debug();
