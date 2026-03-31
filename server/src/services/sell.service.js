import SellRequest from "../models/SellRequest.js";
import AppError from "../utils/AppError.js";
import { createAdminNotification } from "./adminNotification.service.js";
import * as pricingService from "../modules/pricing/pricing.service.js";
import Device from "../models/Device.js";

const VALID_TRANSITIONS = {
  new: ["contacted", "closed", "PAYMENT_PENDING", "REJECTED"],
  contacted: ["closed", "PAYMENT_PENDING", "REJECTED"],
  closed: [],
  CREATED: ["PAYMENT_PENDING", "REJECTED"],
  PAYMENT_PENDING: ["PAID", "REJECTED"],
  PAID: ["VERIFIED", "REJECTED"],
  VERIFIED: ["COMPLETED", "REJECTED"],
  COMPLETED: [],
  REJECTED: [],
};

const CONDITION_MAP = {
  new: "new",
  like_new: "like_new",
  refurbished: "refurbished",
  pre_owned: "pre_owned",
};

export async function submitSellRequest(userId, payload, storedImages) {
  const {
    fullName,
    phone,
    email,
    deviceName,
    deviceCondition,
    expectedPrice,
    notes,
    requestType,
  } = payload;

  const normalizedCondition = CONDITION_MAP[deviceCondition?.toLowerCase()] || "new";

  let mlPrice = 0,
    suggestedPrice = 0,
    mlConfidence = 0;
  try {
    const baseDevice = await Device.findOne({
      name: { $regex: new RegExp(`^${deviceName.trim()}$`, "i") },
    });

    if (baseDevice) {
      const estimation = await pricingService.estimateDeviceValue(
        baseDevice.price,
        normalizedCondition
      );
      mlPrice = estimation.mlEstimatedPrice || 0;
      suggestedPrice = estimation.estimatedPrice || 0;
      mlConfidence = estimation.isMLUsed ? 0.85 : 0;
    }
  } catch (pricingErr) {
    console.warn("AI Pricing skipped:", pricingErr.message);
  }

  const doc = await SellRequest.create({
    isGuest: false,
    userId,
    fullName: String(fullName).trim(),
    phone: String(phone).trim(),
    email: email ? String(email).trim() : "",
    deviceName: String(deviceName).trim(),
    deviceCondition: normalizedCondition,
    expectedPrice: Number(expectedPrice) || 0,
    requestType: ["sell", "exchange"].includes(requestType)
      ? requestType
      : "sell",
    mlPrice,
    suggestedPrice,
    mlConfidence,
    notes: notes ? String(notes).trim() : "",
    images: storedImages,
    status: "new",
  });

  // Background Admin Notification
  createAdminNotification({
    type: "NEW_SELL_REQUEST",
    entityModel: "SellRequest",
    entityId: doc._id,
    message: `New sell request: ${deviceName || "Device"}`,
  }).catch(() => null);

  return doc;
}

export async function transitionSellRequest(sellRequestId, newStatus) {
  const req = await SellRequest.findById(sellRequestId);
  if (!req) throw new AppError("SellRequest not found", 404);

  const allowed = VALID_TRANSITIONS[req.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(`Cannot transition from ${req.status} to ${newStatus}`, 400);
  }

  req.status = newStatus;
  await req.save();
  return req;
}

export async function getMySellRequests(userId, query) {
  const { status, limit = 20, page = 1, sort = "-createdAt" } = query || {};
  const filter = { userId, isDeleted: false };
  if (status) filter.status = String(status).toUpperCase();

  const lim = Math.max(1, Math.min(50, Number(limit) || 20));
  const skip = (Math.max(1, Number(page) || 1) - 1) * lim;
  const safeSort = ["-createdAt", "createdAt"].includes(sort) ? sort : "-createdAt";

  const [items, total] = await Promise.all([
    SellRequest.find(filter).sort(safeSort).skip(skip).limit(lim),
    SellRequest.countDocuments(filter)
  ]);

  return { items, total, page: Number(page) || 1, limit: lim };
}
