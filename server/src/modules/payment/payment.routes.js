import express from "express";
import * as paymentController from "./payment.controller.js";
import authUser from "../../middleware/authUser.js";
import validate from "../../middleware/validate.js";
import { initiateEsewaSchema, initiateEsewaCheckoutSchema } from "./payment.validation.js";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { paymentLimiter } from "../../middleware/rateLimiters.js";

const router = express.Router();

// Public callbacks (eSewa redirects)
router.get("/esewa/success", paymentController.esewaSuccess);
router.post("/esewa/success", paymentController.esewaSuccess);
router.get("/esewa/failure", paymentController.esewaFailure);

// JSON Verification (called by frontend)
router.get("/verify/esewa", paymentLimiter, paymentController.verifyEsewa);

// Protected initiation
router.post(
  "/esewa/initiate",
  paymentLimiter,
  authUser,
  validate(initiateEsewaSchema),
  paymentController.initiateEsewa
);

router.post(
  "/esewa/initiate-checkout",
  paymentLimiter,
  authUser,
  validate(initiateEsewaCheckoutSchema),
  paymentController.initiateEsewaCheckout
);
 
// Admin only: Manual verification
router.post(
  "/admin/verify/:id",
  authUser,
  requireAdmin,
  paymentController.adminVerifyPayment
);

export default router;
