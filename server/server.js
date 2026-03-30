// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import { connectDB } from "./src/config/db.js";
import { assertEnv, getCorsOrigins, getIsProd, getPort } from "./src/config/env.js";
import { notFound, errorHandler } from "./src/middleware/error.js";
import { ensureAdminSeeded } from "./src/scripts/ensureAdminSeeded.js";
import { apiLimiter } from "./src/middleware/rateLimiters.js";
import { sanitizeMongo } from "./src/middleware/sanitizeMongo.js";
import { requestId } from "./src/middleware/requestId.js";
import { httpLogger } from "./src/utils/logger.js";
import { isCloudinaryMode } from "./src/utils/upload.js";
import { configureCloudinary } from "./src/utils/cloudinary.js";
import { requireCsrf } from "./src/middleware/requireCsrf.js";
import { sanitizeXss } from "./src/middleware/sanitizeXss.js";
import * as Sentry from "@sentry/node";

// Routes
import { deviceRoutes, adminDeviceRoutes as modularAdminDeviceRoutes } from "./src/modules/device/device.routes.js";
import heroRoutes from "./src/routes/hero.routes.js";
import reviewRoutes from "./src/routes/review.routes.js";
import productReviewRoutes from "./src/routes/productReview.routes.js";
import sellRoutes from "./src/routes/sell.routes.js";
import faqRoutes from "./src/routes/faq.routes.js";

import userRoutes from "./src/modules/user/user.routes.js";

import adminAuthRoutes from "./src/routes/admin/auth.routes.js";

import adminHeroRoutes from "./src/routes/admin/hero.routes.js";
// import adminDeviceRoutes from "./src/routes/admin/device.routes.js"; // consolidated into modular routes
import adminReviewRoutes from "./src/routes/admin/review.routes.js";
import adminNotificationsRoutes from "./src/routes/admin/notifications.routes.js";
import adminProductReviewRoutes from "./src/routes/admin/productReview.routes.js";
import adminSellRoutes from "./src/routes/admin/sell.routes.js";
import adminUploadRoutes from "./src/routes/admin/upload.routes.js";
import adminStatsRoutes from "./src/routes/admin/stats.routes.js";
import adminFaqRoutes from "./src/routes/admin/faq.routes.js";
import adminOrderRoutes from "./src/routes/admin/order.routes.js";
import adminUsersRoutes from "./src/routes/admin/users.routes.js";
import adminAuditRoutes from "./src/routes/admin/audit.routes.js";
import adminAnalyticsRoutes from "./src/routes/admin/analytics.routes.js";
import adminPricingRoutes from "./src/routes/admin/pricing.routes.js";

// import adminPaymentRoutes from "./src/routes/admin/payment.routes.js"; // disabled for no-payments ship

import csrfRoutes from "./src/routes/csrf.routes.js";
import cartRoutes from "./src/routes/cart.routes.js";
import orderRoutes from "./src/modules/order/order.routes.js";
import paymentRoutes from "./src/modules/payment/payment.routes.js";
import pricingRoutes from "./src/modules/pricing/pricing.routes.js";

dotenv.config();

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}

// ================= APP INIT =================
const app = express();
app.disable("x-powered-by");

// Trust proxy is REQUIRED in production behind Nginx/Render/Heroku etc.
// Allows correct req.secure, IPs, and secure cookies.
app.set("trust proxy", 1);

const PORT = getPort();
const isProd = getIsProd();

// ================= ENV + SAFETY =================
assertEnv();

if (isProd && !isCloudinaryMode()) {
  throw new Error("Production requires UPLOAD_MODE=cloudinary (no local disk uploads allowed).");
}

if (isCloudinaryMode()) {
  configureCloudinary();
  // eslint-disable-next-line no-console
  console.log("✅ Cloudinary configured (UPLOAD_MODE=cloudinary)");
}

// ================= MIDDLEWARE =================
app.use(requestId);

app.use(
  helmet({
    contentSecurityPolicy: isProd ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Add trusted scripts if needed
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.esewa.com.np"],
        connectSrc: ["'self'", "https://*.esewa.com.np"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    } : false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

app.use(compression());

// Strict Rate Limiting
app.use("/api/", apiLimiter);

// NoSQL Injection protection
app.use(sanitizeMongo);

// XSS protection
app.use(sanitizeXss);

// CORS
const devOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const baseOrigins = getCorsOrigins(); // expects array of allowed origins from env
const allowedOrigins = isProd ? baseOrigins : baseOrigins.concat(devOrigins);
const dockerLocalRegex = /^http:\/\/172\.\d+\.\d+\.\d+:\d+$/;
// Vite may bind to 5175, 5176, … when default ports are busy
const devLocalhostAnyPort = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      // If you forgot to set CORS in production, fail hard
      if (isProd && allowedOrigins.length === 0) {
        return callback(new Error("CORS misconfigured: CORS_ORIGINS is empty"), false);
      }

      // In dev, allow everything if no origins are configured
      if (!isProd && allowedOrigins.length === 0) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (!isProd && dockerLocalRegex.test(origin)) return callback(null, true);
      if (!isProd && devLocalhostAnyPort.test(origin)) return callback(null, true);

      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

app.use(httpLogger);

// ================= HEALTH =================
app.get("/api/health", (req, res) => {
  const state = mongoose.connection.readyState;
  res.json({
    status: "ok",
    db: state === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/ready", (req, res) => {
  const state = mongoose.connection.readyState;
  const dbReady = state === 1;
  if (!dbReady) return res.status(503).json({ ready: false, db: "disconnected" });
  return res.json({ ready: true, db: "connected" });
});

// ================= CSRF =================
// Production-safe behavior:
// - Always require CSRF for unsafe methods (POST/PUT/PATCH/DELETE),
// - EXCEPT:
//   * /api/v1/csrf (token fetch)
//   * auth login/register (safe to leave open)
//   * password recovery endpoints (forgot/reset) (open; rate limit these separately)
//   * payment webhooks (only safe if signature verification exists; otherwise disable in controller in prod)
app.use((req, res, next) => {
  if (!req.path.startsWith("/api/")) return next();

  const unsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  if (!unsafe) return next();

  if (req.path.startsWith("/api/v1/csrf")) return next();

  // allow webhooks (verification must happen inside controller)
  if (req.path.startsWith("/api/v1/payments/webhook/")) return next();

  // allow recovery endpoints only
  if (req.path.startsWith("/api/v1/user/forgot-password")) return next();
  if (req.path.startsWith("/api/v1/user/reset-password")) return next();

  // allow login/register
  if (req.path.startsWith("/api/v1/user/login")) return next();
  if (req.path.startsWith("/api/v1/user/register")) return next();
  if (req.path.startsWith("/api/admin/auth/login")) return next();

  // everything else requires CSRF
  return requireCsrf(req, res, next);
});

// ================= STATIC =================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!isProd && !isCloudinaryMode()) {
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
}

// ================= ROUTES =================
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/devices", deviceRoutes);
app.use("/api/v1/hero-slides", heroRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/product-reviews", productReviewRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/pricing", pricingRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/sell-requests", sellRoutes);
app.use("/api/v1/faqs", faqRoutes);
app.use("/api/v1/csrf", csrfRoutes);

// Admin Routes
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/admin/devices", modularAdminDeviceRoutes);
app.use("/api/admin/hero", adminHeroRoutes);
app.use("/api/admin/reviews", adminReviewRoutes);
app.use("/api/admin/product-reviews", adminProductReviewRoutes);
app.use("/api/admin/stats", adminStatsRoutes);
app.use("/api/admin/faqs", adminFaqRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/admin/audit", adminAuditRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/admin/pricing", adminPricingRoutes);
app.use("/api/admin/upload", adminUploadRoutes);
app.use("/api/admin/notifications", adminNotificationsRoutes);
app.use("/api/admin/sell-requests", adminSellRoutes);
// app.use("/api/admin/payments", adminPaymentRoutes); // disabled for no-payments ship

// ================= ERRORS =================
app.use(notFound);
app.use(errorHandler);

// ================= START (AFTER DB CONNECT) =================
async function start() {
  try {
    await connectDB(process.env.MONGO_URI);
    // eslint-disable-next-line no-console
    console.log("✅ MongoDB connected successfully");

    await ensureAdminSeeded();

    const server = app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`✅ CashYourPhone backend running on port ${PORT}`);
    });

    // Graceful shutdown
    async function shutdown(signal) {
      try {
        // eslint-disable-next-line no-console
        console.log(`\n🛑 ${signal} received. Shutting down...`);

        server.close(() => {
          // eslint-disable-next-line no-console
          console.log("✅ HTTP server closed");
        });

        await mongoose.connection.close(false);
        // eslint-disable-next-line no-console
        console.log("✅ MongoDB connection closed");

        process.exit(0);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("❌ Shutdown error:", e);
        process.exit(1);
      }
    }

    // Crash safety
    process.on("unhandledRejection", (err) => {
      // eslint-disable-next-line no-console
      console.error("UNHANDLED REJECTION:", err);
      process.exit(1);
    });

    process.on("uncaughtException", (err) => {
      // eslint-disable-next-line no-console
      console.error("UNCAUGHT EXCEPTION:", err);
      process.exit(1);
    });

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("❌ Startup failed:", err?.message || err);
    process.exit(1);
  }
}
start();
