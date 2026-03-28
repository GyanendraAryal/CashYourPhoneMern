import crypto from "crypto";
import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import AppError from "../utils/AppError.js";

function getEsewaConfig() {
  const productCode = String(process.env.ESEWA_PRODUCT_CODE || "").trim();
  const secretKey = String(process.env.ESEWA_SECRET_KEY || "").trim();
  const formUrl = String(process.env.ESEWA_FORM_URL || "").trim();
  const statusBaseUrl = String(process.env.ESEWA_STATUS_BASE_URL || "").trim();
  const clientReturnUrl = String(process.env.CLIENT_APP_URL || process.env.FRONTEND_URL || "").trim();
  const serverPublicUrl = String(process.env.SERVER_PUBLIC_URL || "").trim();

  if (!secretKey && process.env.NODE_ENV === "production") {
    throw new AppError("CRITICAL: Missing eSewa secret key in production", 500);
  }

  return {
    productCode: productCode || "EPAYTEST",
    secretKey,
    formUrl: formUrl || "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
    statusBaseUrl: statusBaseUrl || "https://uat.esewa.com.np/api/epay/transaction/status/",
    clientReturnUrl: clientReturnUrl || "http://localhost:5173",
    serverPublicUrl: serverPublicUrl || "http://localhost:4000",
  };
}

function hmacSha256Base64(message, secretKey) {
  const h = crypto.createHmac("sha256", secretKey);
  h.update(String(message));
  return h.digest("base64");
}

function safeParseBase64Json(b64) {
  try {
    return JSON.parse(Buffer.from(String(b64 || ""), "base64").toString("utf8"));
  } catch {
    return null;
  }
}

async function esewaStatusCheck({ statusBaseUrl, productCode, totalAmount, transactionUuid }) {
  const url = new URL(statusBaseUrl);
  url.searchParams.set("product_code", productCode);
  url.searchParams.set("total_amount", String(totalAmount));
  url.searchParams.set("transaction_uuid", String(transactionUuid));

  const resp = await fetch(url.toString(), { method: "GET" });
  if (!resp.ok) {
    const data = await resp.json().catch(() => null);
    throw new AppError(data?.error_message || `eSewa status check failed (${resp.status})`, 502);
  }
  return await resp.json();
}

/**
 * Initiate an eSewa payment workflow.
 */
export async function initiateEsewaTransaction(orderId, userId) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);
  if (String(order.user) !== String(userId)) throw new AppError("Forbidden", 403);
  if (order.paymentStatus === "paid") throw new AppError("Already paid", 400);

  const { productCode, secretKey, formUrl, clientReturnUrl, serverPublicUrl } = getEsewaConfig();

  // Idempotency: Cancel pending initiated payments
  await Payment.updateMany(
    { order: order._id, provider: "esewa", status: "initiated" },
    { $set: { status: "cancelled" } }
  );

  const payment = await Payment.create({
    order: order._id,
    provider: "esewa",
    amount: order.total,
    status: "initiated",
    reference: "",
  });

  const transactionUuid = String(payment._id);
  payment.transactionUuid = transactionUuid;
  await payment.save();

  const amountNum = Number(order.total || 0);
  const totalAmount = amountNum.toFixed(2);
  const signedFieldNames = "total_amount,transaction_uuid,product_code";
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const signature = hmacSha256Base64(message, secretKey);

  const base = serverPublicUrl.replace(/\/$/, "");
  return {
    paymentId: transactionUuid,
    provider: "esewa",
    paymentUrl: formUrl,
    fields: {
      amount: totalAmount,
      tax_amount: "0",
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: productCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${base}/api/v1/payments/esewa/success`,
      failure_url: `${base}/api/v1/payments/esewa/failure`,
      signed_field_names: signedFieldNames,
      signature,
    },
    returnTo: `${clientReturnUrl}/order-success/${order._id}`,
  };
}

/**
 * Handle eSewa success callback securely.
 */
export async function verifyEsewaSuccess(encodedData) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productCode, secretKey, statusBaseUrl, clientReturnUrl } = getEsewaConfig();
    const payload = safeParseBase64Json(encodedData);
    if (!payload) throw new AppError("Invalid base64 payload from eSewa", 400);

    const { transaction_uuid, signature, signed_field_names, transaction_code } = payload;
    if (!transaction_uuid || !signature || !signed_field_names) {
      throw new AppError("Incomplete payload from eSewa callback", 400);
    }

    // MANDATORY signature check
    const fields = signed_field_names.split(",");
    const message = fields.map((f) => `${f}=${payload[f]}`).join(",");
    const expectedSig = hmacSha256Base64(message, secretKey);

    if (expectedSig !== signature) {
      throw new AppError("Security check failed: Invalid signature", 403);
    }

    const payment = await Payment.findById(transaction_uuid).populate("order").session(session);
    if (!payment) throw new AppError("Payment record not found", 404);
    const orderId = payment.order?._id;

    // Idempotency check 
    if (payment.status === "succeeded") {
      await session.commitTransaction();
      return { status: "already_paid", orderId, clientReturnUrl };
    }

    // Strict server-to-server check
    const dbAmount = Number(payment.amount || 0).toFixed(2);
    const statusResp = await esewaStatusCheck({
      statusBaseUrl,
      productCode,
      totalAmount: dbAmount,
      transactionUuid: transaction_uuid,
    });

    const verifiedStatus = String(statusResp?.status || "").toUpperCase();
    const refId = statusResp?.refId || transaction_code;

    payment.rawCallback = payload;
    payment.attempts = (payment.attempts || 0) + 1;
    payment.lastCheckedAt = new Date();
    payment.verifiedAt = new Date(); // NEW: Tracking time of verification

    if (verifiedStatus === "COMPLETE") {
      payment.status = "succeeded";
      payment.reference = String(refId);
      payment.esewaRefId = String(refId);

      if (payment.order) {
        payment.order.paymentStatus = "paid";
        payment.order.status = "processing";
        await payment.order.save({ session });
        await Cart.deleteOne({ user: payment.order.user }).session(session);
      }

      await payment.save({ session });
      await session.commitTransaction();
      return { status: "success", orderId, clientReturnUrl };
    } else {
      payment.status = verifiedStatus.startsWith("CANC") ? "cancelled" : "failed";
      await payment.save({ session });
      await session.commitTransaction();
      return { status: "failed", orderId, clientReturnUrl, msg: verifiedStatus };
    }
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Handle eSewa failure securely.
 */
export async function handleEsewaFailure(encodedData) {
  const { clientReturnUrl } = getEsewaConfig();
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
