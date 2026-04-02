import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import { createAdminNotification } from "../services/adminNotification.service.js";
import Device from "../models/Device.js";
import Counter from "../models/Counter.js";

export async function genSequentialOrderNumber(session) {
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

export async function createOrderFromCart(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // --- Guard: ensure user is attached by authUser middleware ---
    if (!req.user?.id) {
      await session.abortTransaction();
      return res.status(401).json({ message: "Unauthorized" });
    }

    // --- validate checkout contact ---
    const contact = req.body?.contact || {};
    const fullName = String(contact.fullName || "").trim();
    const phone = String(contact.phone || "").trim();
    const email = String(contact.email || "").trim();
    const address = String(contact.address || "").trim();

    if (!fullName || !phone || !address) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Contact details are required (fullName, phone, address)",
      });
    }

    const cart = await Cart.findOne({ user: req.user.id }).session(session);
    
    if (!cart) {
      await session.abortTransaction();
      console.error(`[Order] Cart not found for user: ${req.user.id}`);
      return res.status(400).json({ message: "Cart not found. Please add items to your cart first." });
    }

    // ✅ Defensive: normalize items in case of corrupted DB document
    if (!Array.isArray(cart.items)) cart.items = [];

    if (cart.items.length === 0) {
      await session.abortTransaction();
      console.error(`[Order] Cart is empty for user: ${req.user.id}`);
      return res.status(400).json({ message: "Your cart is empty. Please add items to your cart before placing an order." });
    }

    // Validate cart items against current catalog (exists, in stock, price unchanged)
    const productIds = cart.items.map((it) => it.product).filter(Boolean);

    const devices = await Device.find({ _id: { $in: productIds } })
      .select("price availability name thumbnail images condition")
      .session(session);

    const byId = new Map(devices.map((d) => [String(d._id), d]));

    for (const it of cart.items) {
      const d = byId.get(String(it.product));
      if (!d) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Device removed from catalog" });
      }

      if (String(d.availability || "").toLowerCase() === "out_of_stock") {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ message: `Device out of stock: ${d.name || "Item"}` });
      }

      const snap = Number(it.priceSnapshot || 0);
      const now = Number(d.price || 0);
      if (Number.isFinite(snap) && Number.isFinite(now) && snap !== now) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Price changed for this item" });
      }
    }

    let total = 0;

    // Build order items using Device as source-of-truth for snapshots
    const items = cart.items
      .map((it) => {
        const d = byId.get(String(it.product));
        const qty = Number(it.qty || 0);
        const price = Number(it.priceSnapshot || 0);

        if (!it.product || !d) return null;
        if (!Number.isFinite(qty) || qty <= 0) return null;
        if (!Number.isFinite(price) || price < 0) return null;

        total += price * qty;

        return {
          product: it.product,
          name: String(d.name || ""),
          condition: String(d.condition || ""),
          price,
          qty,
        };
      })
      .filter(Boolean);

    if (items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Cart has no valid items" });
    }

    // ✅ Generate sequential order number
    const orderNumber = await genSequentialOrderNumber(session);

    const orderDoc = {
      orderNumber,
      user: req.user.id,
      contact: { fullName, phone, email, address },
      items,
      total,
      status: "created",
      paymentStatus: "unpaid",
    };

    const created = await Order.create([orderDoc], { session });

    // Admin notification (idempotent, inside txn)
    await createAdminNotification({
      type: "NEW_ORDER",
      entityModel: "Order",
      entityId: created[0]._id,
      message: `New order created: ${orderNumber}`,
      session,
    });

    // ✅ Clear the cart immediately after order creation.
    // Order is persisted as paymentStatus: "unpaid" — users who fail payment
    // can see their order in /my-orders and re-initiate payment.
    cart.items = [];
    cart.lastUpdatedAt = new Date();
    await cart.save({ session });

    await session.commitTransaction();
    return res.status(201).json(created[0]);
  } catch (e) {
    try {
      await session.abortTransaction();
    } catch {
      // ignore abort errors
    }
    return next(e);
  } finally {
    session.endSession();
  }
}

export async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(orders);
  } catch (e) {
    return next(e);
  }
}

export async function getOrderById(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // ownership check
    if (!order.user?.equals?.(req.user.id)) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json(order);
  } catch (e) {
    return next(e);
  }
}

export async function cancelOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!order.user?.equals?.(req.user.id)) {
      return res.status(404).json({ message: "Order not found" });
    }

    // cancel rules (example)
    if (order.status !== "created") {
      return res.status(400).json({ message: "Cannot cancel order" });
    }

    order.status = "cancelled";
    await order.save();

    return res.json(order);
  } catch (e) {
    return next(e);
  }
}
