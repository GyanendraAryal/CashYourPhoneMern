import { Router } from "express";
import { login, me, logout } from "../../controllers/admin/auth.controller.js";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { adminLoginLimiter } from "../../middleware/rateLimiters.js";
import { requireCsrf } from "../../middleware/requireCsrf.js";

const router = Router();

// Public: login route (strong rate limit)
router.post("/login", adminLoginLimiter, login);

// Protected: get current admin info
router.get("/me", requireAdmin, me);

// Protected: logout (clears admin cookie)
router.post("/logout", requireAdmin, requireCsrf, logout);

export default router;
