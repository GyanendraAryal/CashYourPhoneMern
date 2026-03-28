import mongoose from "mongoose";
import Cart from "../../models/Cart.js";
import Order from "../../models/Order.js";
import Device from "../../models/Device.js";
import Counter from "../../models/Counter.js";
import { createAdminNotification } from "../../services/adminNotification.service.js";
import AppError from "../../utils/AppError.js";

/**
 * Generate a sequential order number (e.g., CYP-20260321-000001)
 */
async function genSequentialOrderNumber(session) {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  const c = await Counter.findByIdAndUpdate(
    { _id: "order" },
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
      if (!d) throw new AppError(`Device ${it.product} not found in catalog`, 400);
      
      if (d.availability === "out_of_stock" || (d.quantity !== undefined && d.quantity < it.qty)) {
        throw new AppError(`Device out of stock or insufficient quantity: ${d.name}`, 400);
      }

      if (Number(it.priceSnapshot) !== Number(d.price)) {
        throw new AppError(`Price changed for item: ${d.name}. Please refresh cart.`, 400);
      }

      const qty = Number(it.qty || 0);
      const price = Number(d.price || 0);
      total += price * qty;

      return {
        product: it.product,
        name: d.name,
        condition: d.condition,
        price,
        qty,
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
export const getUserOrders = async (userId) => {
  return await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
};

/**
 * GET order by ID
 */
export const getOrder = async (orderId, userId) => {
  const order = await Order.findById(orderId);
  if (!order || !order.user.equals(userId)) {
    throw new AppError("Order not found", 404);
  }
  return order;
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
