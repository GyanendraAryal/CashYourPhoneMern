import express from "express";
import * as userController from "./user.controller.js";
import authUser from "../../middleware/authUser.js";
import validate from "../../middleware/validate.js";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema } from "./user.validation.js";
import { authLimiter } from "../../middleware/rateLimiters.js";

const router = express.Router();

// Public routes
router.post("/register", authLimiter, validate(registerSchema), userController.register);
router.post("/login", authLimiter, validate(loginSchema), userController.login);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), userController.forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), userController.resetPassword);

// Refresh and Logout need access to cookies but should NOT require a VALID access_token!
router.post("/refresh", userController.refresh);
router.post("/logout", userController.logout);

// Protected routes
router.use(authUser);
router.get("/me", userController.getMe);
router.patch("/me", validate(updateProfileSchema), userController.updateMe);

export default router;
