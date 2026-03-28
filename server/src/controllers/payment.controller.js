import * as paymentService from "../services/payment.service.js";

export async function initiateEsewa(req, res, next) {
  try {
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ message: "orderId is required" });

    const result = await paymentService.initiateEsewaTransaction(orderId, req.user.id);
    return res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function esewaSuccess(req, res, next) {
  let clientReturnUrl = process.env.CLIENT_APP_URL || "http://localhost:5173";
  try {
    const b64 = req.query?.data || req.body?.data;
    if (!b64) throw new Error("Missing response data from eSewa");

    const result = await paymentService.verifyEsewaSuccess(b64);
    
    if (result.status === "already_paid" || result.status === "success") {
      return res.redirect(`${result.clientReturnUrl}/order-success/${result.orderId}?paid=1&provider=esewa`);
    }

    return res.redirect(`${result.clientReturnUrl}/checkout?payment=failed&provider=esewa&status=${result.msg}`);
  } catch (err) {
    console.error("[ESEWA CALLBACK ERROR]", err.message);
    return res.redirect(`${clientReturnUrl}/checkout?payment=error&message=${encodeURIComponent(err.message)}`);
  }
}

export async function esewaFailure(req, res, next) {
  try {
    const b64 = req.query?.data || req.body?.data;
    const result = await paymentService.handleEsewaFailure(b64);
    return res.redirect(`${result.clientReturnUrl}/checkout?payment=failed&provider=esewa`);
  } catch (e) {
    next(e);
  }
}

// Stubs for legacy support
export async function createPaymentIntent() {}
export async function paymentWebhook() {}
export async function verifyKhalti() {}
export async function verifyEsewa() {}