// Deprecated — do not mount; active payment routes live in src/modules/payment/payment.routes.js
import express from "express";
import authUser from "../middleware/authUser.js";
import {
  createPaymentIntent,
  verifyKhalti,
  verifyEsewa,
  initiateEsewa,
  esewaSuccess,
  esewaFailure,
  paymentWebhook,
} from "../controllers/payment.controller.js";

const router = express.Router();

// payment-ready stubs / legacy helpers
router.post("/intent", authUser, createPaymentIntent);
router.post("/verify/khalti", authUser, verifyKhalti);
router.post("/verify/esewa", authUser, verifyEsewa);

// eSewa ePay v2 (development-ready flow)
router.post("/esewa/initiate", authUser, initiateEsewa);
// callbacks from eSewa are typically GET redirects (user browser)
router.get("/esewa/success", esewaSuccess);
router.get("/esewa/failure", esewaFailure);

// legacy (kept for compatibility)
// user-authenticated: user starts payment for their own order
router.post("/create-intent", authUser, createPaymentIntent);

// public: provider calls this (must verify signature / verify server-to-server)
router.post("/webhook/:provider", paymentWebhook);

export default router;
