import express from "express";

import { register, login, refresh, logout, logoutAll } from "../controllers/auth.controller.js";
import { forgotPassword, resetPassword } from "../controllers/authRecovery.controller.js";
import authUser from "../middleware/authUser.js";
import { requireCsrf } from "../middleware/requireCsrf.js";
import { authLimiter } from "../middleware/rateLimiters.js";

import validate from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/user.schema.js";

const router = express.Router();

// Public auth (rate limited)
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);

// Refresh rotates cookies -> protect with CSRF
router.post("/refresh", authLimiter, requireCsrf, refresh);

// Logout endpoints should be authenticated + CSRF-protected
router.post("/logout", authUser, requireCsrf, logout);
router.post("/logout-all", authUser, requireCsrf, logoutAll);

// Recovery (rate limited)
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

export default router;
