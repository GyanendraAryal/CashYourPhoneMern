import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./src/config/db.js";
import { notFound, errorHandler } from "./src/middleware/error.js";
import { ensureAdminSeeded } from "./src/seeds/seedAdmin.js";
import { requireAdmin } from "./src/middleware/requireAdmin.js";

import authRoutes from "./src/routes/auth.routes.js";
import deviceRoutes from "./src/routes/device.routes.js";
import heroRoutes from "./src/routes/hero.routes.js";
import reviewRoutes from "./src/routes/review.routes.js";
import sellRoutes from "./src/routes/sell.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";

dotenv.config();

const app = express();

// ✅ CORS allowlist from env
const defaultDevOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow Postman / cURL (no origin)
      if (!origin) return cb(null, true);

      // Define your fallback dev origins
      const devOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
      ];

      // Include internal Docker IPs automatically
      const dockerLocalRegex = /^http:\/\/172\.\d+\.\d+\.\d+:\d+$/;

      // Include any custom env origins
      const allAllowed = (process.env.CORS_ORIGINS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .concat(devOrigins);

      if (allAllowed.includes(origin) || dockerLocalRegex.test(origin)) {
        return cb(null, true);
      }

      console.log("❌ Blocked by CORS:", origin);
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);



app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve local uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/health", (req, res) => res.json({ ok: true }));

// ✅ Public admin auth routes (login)
app.use("/api/admin/auth", authRoutes);

// ✅ Protected routes (must have Bearer token)
app.use("/api/admin/upload", requireAdmin, uploadRoutes);
app.use("/api/admin/devices", requireAdmin, deviceRoutes);
app.use("/api/admin/hero-slides", requireAdmin, heroRoutes);
app.use("/api/admin/reviews", requireAdmin, reviewRoutes);
app.use("/api/admin/sell-requests", requireAdmin, sellRoutes);

// Errors
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5050;

await connectDB();
await ensureAdminSeeded();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Admin API running on port ${PORT}`);
});
