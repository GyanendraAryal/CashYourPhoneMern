import mongoose from "mongoose";
import Cart from "../../models/Cart.js";
import Order from "../../models/Order.js";
import Device from "../../models/Device.js";
import Counter from "../../models/Counter.js";
import { createAdminNotification } from "../../services/adminNotification.service.js";
import AppError from "../../utils/AppError.js";
import { toPublicUploadUrl } from "../../utils/upload.js";

/**
 * Generate a sequential order number (e.g., CYP-20260321-000001)
 */
async function genSequentialOrderNumber(session) {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  const c = await Counter.findByIdAndUpdate(
    "order",
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );

  const seq = String(c.seq).padStart(6, "0");
  return `CYP-${yyyy}${mm}${dd}-${seq}`;
}

/**
 * CREATE order from cart
 */
export const createOrder = async (userId, contactData, session) => {
  const { fullName, phone, email, address } = contactData;

  const cart = await Cart.findOne({ user: userId }).session(session);

  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  const productIds = cart.items.map((it) => it.product).filter(Boolean);
  const devices = await Device.find({ _id: { $in: productIds } }).session(session);
  const byId = new Map(devices.map((d) => [String(d._id), d]));

  let total = 0;
  const items = cart.items
    .map((it) => {
      const d = byId.get(String(it.product));
      if (!d) {
        console.error(`[CHECKOUT FAIL] Device ${it.product} not found in catalog. User: ${userId}`);
        throw new AppError(`Product ID ${it.product} is no longer in our catalog. Please remove it from your cart.`, 400);
      }
      
      if (d.availability === "out_of_stock" || (d.quantity !== undefined && d.quantity < it.qty)) {
        throw new AppError(`Device out of stock or insufficient quantity: ${d.name}`, 400);
      }

      // If priceSnapshot is missing or 0, we'll accept the current price for legacy items
      const snapshot = Number(it.priceSnapshot || 0);
      const currentPrice = Number(d.price || 0);
      
      if (snapshot > 0 && snapshot !== currentPrice) {
        console.warn(`Price mismatch for ${d.name}: cart has ${snapshot}, db has ${currentPrice}`);
        throw new AppError(`Price changed for item: ${d.name}. Please refresh cart.`, 400);
      }

      const qty = Number(it.qty || 0);
      const price = currentPrice;
      total += price * qty;

      return {
        product: it.product,
        name: d.name,
        condition: d.condition,
        price,
        qty,
        thumbnail: d.thumbnail || (Array.isArray(d.images) && d.images.length ? d.images[0] : ""),
      };
    })
    .filter(Boolean);

  // Atomic Inventory Decrement
  for (const item of items) {
    await Device.updateOne(
      { _id: item.product, quantity: { $gte: item.qty } },
      { $inc: { quantity: -item.qty } },
      { session }
    );
  }

  const orderNumber = await genSequentialOrderNumber(session);

  const order = await Order.create([{
    orderNumber,
    user: userId,
    contact: { fullName, phone, email, address },
    items,
    total,
    status: "created",
    paymentStatus: "unpaid",
  }], { session });

  await createAdminNotification({
    type: "NEW_ORDER",
    entityModel: "Order",
    entityId: order[0]._id,
    message: `New order created: ${orderNumber}`,
    session,
  });

  cart.items = [];
  cart.lastUpdatedAt = new Date();
  await cart.save({ session });

  return order[0];
};

/**
 * GET user orders
 */
export const getUserOrders = async (userId, req) => {
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
  return orders.map(o => ({
    ...o,
    items: (o.items || []).map(it => ({
      ...it,
      thumbnail: toPublicUploadUrl(req, it.thumbnail || "")
    }))
  }));
};

/**
 * GET order by ID
 */
export const getOrder = async (orderId, userId) => {
  const order = await Order.findById(orderId);
  if (!order || !order.user.equals(userId)) {
    throw new AppError("Order not found", 404);
  }

  const normalized = order.toObject();
  normalized.items = (normalized.items || []).map(it => ({
    ...it,
    thumbnail: toPublicUploadUrl(req, it.thumbnail || "")
  }));

  return normalized;
};

/**
 * CANCEL order
 */
export const cancelUserOrder = async (orderId, userId) => {
  const order = await Order.findById(orderId);
  if (!order || !order.user.equals(userId)) {
    throw new AppError("Order not found", 404);
  }

  if (order.status !== "created") {
    throw new AppError("Order cannot be cancelled in its current state", 400);
  }

  order.status = "cancelled";
  await order.save();
  return order;
};
