import rateLimit from "express-rate-limit";

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const max = Number(process.env.RATE_LIMIT_MAX || 300);

// 🔑 smarter key generator (IP + user)
const keyGenerator = (req) => {
  const userId = req.user?.id || "guest";
  return `${req.ip}-${userId}`;
};

// 🔥 GENERAL API LIMITER
export const apiLimiter = rateLimit({
  windowMs,
  max,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// 🔐 AUTH LIMITER (strict)
export const authLimiter = rateLimit({
  windowMs,
  max: Math.min(max, 30),
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication requests. Try later." },
});

// 🧑‍💼 ADMIN LOGIN (VERY STRICT)
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: Number(process.env.ADMIN_LOGIN_RATE_LIMIT_MAX || 5),
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many admin login attempts." },
});

// ⭐ REVIEW LIMITER
export const reviewCreateLimiter = rateLimit({
  windowMs: Number(process.env.REVIEW_RATE_LIMIT_WINDOW_MS || 10 * 60_000),
  max: Number(process.env.REVIEW_RATE_LIMIT_MAX || 10),
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many reviews submitted." },
});

// 💳 PAYMENT LIMITER (CRITICAL)
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // very strict
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many payment attempts. Try again later." },
});