import mongoose from "mongoose";

export async function connectDB(uri) {
  if (!uri) throw new Error("❌ MONGO_URI is required in environment");

  mongoose.set("strictQuery", true);

  const isProd = process.env.NODE_ENV === "production";

  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      attempts++;

      const conn = await mongoose.connect(uri, {
        autoIndex: !isProd,
        autoCreate: !isProd,
      });

      console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (err) {
      console.error(`❌ MongoDB connection attempt ${attempts} failed:`, err.message);

      if (attempts >= maxAttempts) {
        console.error("🚫 Max MongoDB connection attempts reached. Exiting...");
        process.exit(1);
      }

      await new Promise((res) => setTimeout(res, 3000));
    }
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔁 MongoDB reconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("💥 MongoDB error:", err.message);
});
