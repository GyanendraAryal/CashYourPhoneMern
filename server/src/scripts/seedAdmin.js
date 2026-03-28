import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { ensureAdminSeeded } from "./ensureAdminSeeded.js";

dotenv.config();

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    const result = await ensureAdminSeeded();
    console.log(result?.created ? "✅ Admin created." : "✅ Admin already exists.");
    await mongoose.connection.close(false);
    process.exit(0);
  } catch (e) {
    console.error("❌ Seed failed:", e?.message || e);
    try {
      await mongoose.connection.close(false);
    } catch {}
    process.exit(1);
  }
})();
