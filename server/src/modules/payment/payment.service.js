import crypto from "crypto";
import mongoose from "mongoose";
import Payment from "../../models/Payment.js";
import Order from "../../models/Order.js";
import Cart from "../../models/Cart.js";
import CheckoutSession from "../../models/CheckoutSession.js";
import Device from "../../models/Device.js";
import { genSequentialOrderNumber } from "../../controllers/order.controller.js";
import { createAdminNotification } from "../../services/adminNotification.service.js";
import AppError from "../../utils/AppError.js";

const VALID_PROVIDERS = ["khalti", "esewa", "bank"];

/** Public URL for redirects (does not require ESEWA_SECRET_KEY). */
export function getClientAppUrl() {
  return String(process.env.CLIENT_APP_URL || process.env.FRONTEND_URL || "http://localhost:5173").replace(
    /\/$/,
    ""
  );
}

function safeParseBase64Json(b64) {
  try {
    return JSON.parse(Buffer.from(String(b64 || ""), "base64").toString("utf8"));
  } catch {
    return null;
  }
}

/**
 * Mark pending payment cancelled when eSewa redirects to failure_url (optional encoded payload).
 */
export async function handleEsewaFailure(encodedData) {
  const clientReturnUrl = getClientAppUrl();
  const payload = safeParseBase64Json(encodedData) || {};
  const txUuid = payload?.transaction_uuid || payload?.transactionUuid;

  if (txUuid) {
    const payment = await Payment.findById(String(txUuid));
    if (payment && payment.status !== "succeeded") {
      payment.status = "cancelled";
      payment.attempts = Number(payment.attempts || 0) + 1;
      payment.lastCheckedAt = new Date();
      payment.rawCallback = { status: "CANCELLED", transaction_uuid: String(txUuid) };
      await payment.save();
    }
  }

  return { clientReturnUrl };
}

/**
 * eSewa Configuration Helper
 */
export const getEsewaConfig = () => {
  const secretKey = String(process.env.ESEWA_SECRET_KEY || "").trim();
  if (!secretKey) throw new AppError("ESEWA_SECRET_KEY is missing", 500);

  return {
    productCode: process.env.ESEWA_PRODUCT_CODE || "EPAYTEST",
    secretKey,
    formUrl: process.env.ESEWA_FORM_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
    statusBaseUrl: process.env.ESEWA_STATUS_BASE_URL || "https://uat.esewa.com.np/api/epay/transaction/status/",
    clientReturnUrl: process.env.CLIENT_APP_URL || "http://localhost:5173",
    serverPublicUrl: process.env.SERVER_PUBLIC_URL || "http://localhost:4000",
  };
};

/**
 * Common HMAC SHA256 signer
 */
export const buildSignature = (message, secret) => {
  return crypto.createHmac("sha256", secret).update(String(message)).digest("base64");
};

/**
 * INITIATE payment (Generic)
 */
export const initiatePayment = async (orderId, userId, provider) => {
  if (!VALID_PROVIDERS.includes(provider)) throw new AppError("Invalid payment provider", 400);

  const order = await Order.findById(orderId);
  if (!order || !order.user.equals(userId)) throw new AppError("Order not found", 404);
  if (order.paymentStatus === "paid") throw new AppError("Order already paid", 400);

  // Cancel previous attempts
  await Payment.updateMany({ order: orderId, status: "initiated" }, { $set: { status: "cancelled" } });

  return await Payment.create({
    order: orderId,
    provider,
    amount: order.total,
    status: "initiated",
  });
};

/**
 * eSewa specific initiation
 */
export const initiateEsewaPayment = async (orderId, userId) => {
  const order = await Order.findById(orderId);
  if (!order || !order.user.equals(userId)) throw new AppError("Order not found", 404);
  
  const config = getEsewaConfig();
  const payment = await initiatePayment(orderId, userId, "esewa");
  
  const transactionUuid = String(payment._id);
  const totalAmount = Number(order.total).toFixed(2);
  
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${config.productCode}`;
  const signature = buildSignature(message, config.secretKey);

  return {
    paymentUrl: config.formUrl,
    fields: {
      amount: totalAmount,
      tax_amount: "0",
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: config.productCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${config.serverPublicUrl}/api/v1/payments/esewa/success`,
      failure_url: `${config.serverPublicUrl}/api/v1/payments/esewa/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    }
  };
};

/**
 * eSewa checkout initiation (from Cart directly)
 */
export const initiateEsewaCheckout = async (contactPayload, userId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  const productIds = cart.items.map((it) => it.product).filter(Boolean);
  const devices = await Device.find({ _id: { $in: productIds } });
  const byId = new Map(devices.map((d) => [String(d._id), d]));

  let total = 0;
  const items = cart.items.map((it) => {
    const d = byId.get(String(it.product));
    if (!d || String(d.availability || "").toLowerCase() === "out_of_stock") {
      throw new AppError(`Device unavailable: ${d?.name || "Item"}`, 400);
    }
    const qty = Number(it.qty || 0);
    const price = Number(it.priceSnapshot || 0);
    if (price !== Number(d.price || 0)) {
      throw new AppError("Price changed for an item in your cart", 400);
    }
    if (qty > 0 && price >= 0) total += price * qty;
    return {
      product: it.product,
      name: String(d.name || ""),
      condition: String(d.condition || ""),
      price,
      qty,
      thumbnail: d.thumbnail || ""
    };
  }).filter(Boolean);

  if (items.length === 0) throw new AppError("Cart has no valid items", 400);

  const session = await CheckoutSession.create({
    user: userId,
    contact: contactPayload,
    items,
    total,
  });

  const config = getEsewaConfig();
  const transactionUuid = String(session._id);
  const totalAmount = Number(total).toFixed(2);
  
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${config.productCode}`;
  const signature = buildSignature(message, config.secretKey);

  return {
    paymentUrl: config.formUrl,
    fields: {
      amount: totalAmount,
      tax_amount: "0",
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: config.productCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${config.serverPublicUrl}/api/v1/payments/esewa/success`,
      failure_url: `${config.serverPublicUrl}/api/v1/payments/esewa/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    }
  };
};

/**
 * VERIFY eSewa payment (Server-to-Server)
 */
export const verifyEsewaPayment = async (dataB64) => {
  const config = getEsewaConfig();
  let rawPayload;
  try {
    rawPayload = Buffer.from(String(dataB64 || ""), "base64").toString("utf-8");
  } catch {
    throw new AppError("Invalid payment data encoding", 400);
  }
  let payload;
  try {
    payload = JSON.parse(rawPayload);
  } catch {
    throw new AppError("Invalid payment payload", 400);
  }
  if (!payload || typeof payload !== "object") {
    throw new AppError("Invalid payment payload", 400);
  }

  const { transaction_uuid, signature, signed_field_names } = payload;

  if (!transaction_uuid || !signature || !signed_field_names) {
    throw new AppError("Incomplete payment callback payload", 400);
  }

  // Verify signature
  const message = signed_field_names.split(",").map((f) => `${f}=${payload[f]}`).join(",");
  const expectedSig = buildSignature(message, config.secretKey);

  if (expectedSig !== signature) throw new AppError("Payment security verification failed", 403);

  // Security: Ensure total_amount matches the payment record
  let isCheckoutSession = false;
  let paymentPreview = await Payment.findById(transaction_uuid).populate("order");
  let checkoutSession = null;

  if (!paymentPreview) {
    checkoutSession = await CheckoutSession.findById(transaction_uuid);
    if (!checkoutSession) throw new AppError("Payment record not found", 404);
    isCheckoutSession = true;
  }

  if (!isCheckoutSession && paymentPreview.status === "succeeded") {
    console.log(`[Payment] Idempotent hit: ${transaction_uuid} already succeeded.`);
    return paymentPreview;
  }
  if (isCheckoutSession && checkoutSession.status === "completed") {
    console.log(`[Payment] Idempotent hit: CheckoutSession ${transaction_uuid} already completed.`);
    return await Payment.findOne({ transactionUuid: transaction_uuid }).populate("order");
  }

  const recordAmount = isCheckoutSession 
    ? Number(checkoutSession.total).toFixed(2)
    : Number(paymentPreview.amount).toFixed(2);

  const url = new URL(config.statusBaseUrl);
  url.searchParams.set("product_code", config.productCode);
  url.searchParams.set("total_amount", recordAmount);
  url.searchParams.set("transaction_uuid", transaction_uuid);

  console.log(`[eSewa] Verifying status for ${transaction_uuid} at ${url.origin}...`);
  const resp = await fetch(url.toString());
  const statusData = await resp.json().catch(() => ({}));
  
  console.log(`[eSewa] Status response for ${transaction_uuid}:`, statusData);

  if (statusData?.status !== "COMPLETE") {
    if (paymentPreview) {
      paymentPreview.status = "failed";
      await paymentPreview.save();
    }
    throw new AppError("Payment not completed at provider", 400);
  }

  const session = await mongoose.startSession();
  let paymentResult = paymentPreview;
  try {
    await session.withTransaction(async () => {
      if (isCheckoutSession) {
        const sessionRecord = await CheckoutSession.findById(transaction_uuid).session(session);
        if (sessionRecord.status === "completed") return;

        const orderNumber = await genSequentialOrderNumber(session);
        const orderDoc = {
          orderNumber,
          user: sessionRecord.user,
          contact: sessionRecord.contact,
          items: sessionRecord.items,
          total: sessionRecord.total,
          status: "processing",
          paymentStatus: "paid",
        };
        const createdOrders = await Order.create([orderDoc], { session });
        const newOrder = createdOrders[0];

        // Create Payment record
        const pCreated = await Payment.create([{
          order: newOrder._id,
          provider: "esewa",
          transactionUuid: transaction_uuid,
          amount: sessionRecord.total,
          status: "succeeded",
          reference: statusData.refId,
        }], { session });
        paymentResult = pCreated[0];

        // Mark checkout session as complete
        sessionRecord.status = "completed";
        await sessionRecord.save({ session });

        // Clear user's cart
        await Cart.deleteOne({ user: sessionRecord.user }).session(session);

        // Notify admins
        await createAdminNotification({
          type: "NEW_ORDER",
          entityModel: "Order",
          entityId: newOrder._id,
          message: `New order created & paid via eSewa: ${orderNumber}`,
          session,
        });
      } else {
        const payment = await Payment.findById(transaction_uuid).session(session);
        if (!payment) throw new AppError("Payment record not found", 404);
        if (payment.status === "succeeded") return;

        const order = await Order.findById(payment.order).session(session);
        if (!order) throw new AppError("Order not found", 404);

        payment.status = "succeeded";
        payment.reference = statusData.refId;
        await payment.save({ session });

        order.paymentStatus = "paid";
        order.status = "processing";
        await order.save({ session });

        await Cart.deleteOne({ user: order.user }).session(session);
      }
    });
  } finally {
    await session.endSession();
  }

  if (isCheckoutSession) {
     return await Payment.findById(paymentResult._id).populate("order");
  }
  return await Payment.findById(transaction_uuid).populate("order");
};

/**
 * Admin manual verification (does not require redirect payload)
 */
export async function adminVerifyEsewa(paymentId) {
  const config = getEsewaConfig();
  const payment = await Payment.findById(paymentId).populate("order");
  if (!payment) throw new AppError("Payment record not found", 404);
  if (payment.provider !== "esewa") throw new AppError("Not an eSewa payment", 400);
  
  if (payment.status === "succeeded") return payment;

  const url = new URL(config.statusBaseUrl);
  url.searchParams.set("product_code", config.productCode);
  url.searchParams.set("total_amount", Number(payment.amount).toFixed(2));
  url.searchParams.set("transaction_uuid", String(payment._id));

  console.log(`[Admin] Manually verifying eSewa payment ${paymentId}...`);
  const resp = await fetch(url.toString());
  const statusData = await resp.json().catch(() => ({}));

  if (statusData?.status !== "COMPLETE") {
    throw new AppError(`status of transaction at eSewa is: ${statusData?.status || "UNKNOWN"}`, 400);
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      payment.status = "succeeded";
      payment.reference = statusData.refId;
      payment.webhookVerified = true;
      payment.lastCheckedAt = new Date();
      await payment.save({ session });

      if (payment.order) {
        const order = await Order.findById(payment.order).session(session);
        if (order) {
          order.paymentStatus = "paid";
          order.status = "processing";
          await order.save({ session });
        }
      }
    });
  } finally {
    await session.endSession();
  }

  return await Payment.findById(paymentId).populate("order");
}
