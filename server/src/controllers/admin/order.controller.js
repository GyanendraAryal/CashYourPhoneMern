import mongoose from "mongoose";
import Order from "../../models/Order.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { restoreOrderInventory } from "../../modules/order/order.service.js";

function toInt(v, def) {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
}

const ALLOWED_STATUS = ["created", "processing", "shipped", "completed", "cancelled"];
const ALLOWED_PAYMENT = ["unpaid", "paid", "refunded"];

export const listOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, toInt(req.query.page, 1));
  const limit = Math.min(50, Math.max(1, toInt(req.query.limit, 20)));

  const status = String(req.query.status || "").trim();
  const paymentStatus = String(req.query.paymentStatus || "").trim();

  const filter = {};
  if (status && ALLOWED_STATUS.includes(status)) filter.status = status;
  if (paymentStatus && ALLOWED_PAYMENT.includes(paymentStatus)) filter.paymentStatus = paymentStatus;

  const total = await Order.countDocuments(filter);

  const orders = await Order.find(filter)
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const pages = Math.max(1, Math.ceil(total / limit));

  res.json({
    ok: true,
    data: { orders, total, page, pages, limit },
    orders, total, page, pages, limit, // legacy compatibility
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  const order = await Order.findById(id).populate("user", "name email").lean();
  if (!order) return res.status(404).json({ message: "Order not found" });

  res.json({ ok: true, data: order, ...order }); // keeps legacy shape (raw order fields)
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  const { status } = req.body || {};
  const allowed = ["processing", "shipped", "completed", "cancelled"];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Order not found" });
    }

    const oldStatus = order.status;
    order.status = status;
    await order.save({ session });

    // If newly cancelled, restore stock
    if (status === "cancelled" && oldStatus !== "cancelled") {
      await restoreOrderInventory(order.items, session);
    }

    await session.commitTransaction();
    const out = order.toObject ? order.toObject() : order;
    res.json({ ok: true, data: out, ...out });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});
