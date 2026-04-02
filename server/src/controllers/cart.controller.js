import Cart from "../models/Cart.js";
import Device from "../models/Device.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  assertCartWithinStock,
  buildCartResponse,
  clampQty,
  emptyCartPayload,
  getOrCreateCart,
  loadDeviceOrThrow,
  normVariant,
  variantKey,
} from "../services/cart.service.js";

/**
 * Defensive helper — ensures cart.items is always a valid array.
 * Prevents "Cannot read properties of undefined (reading 'length')" crashes
 * when a corrupted / legacy document is fetched from MongoDB.
 */
function ensureItems(cart) {
  if (cart && !Array.isArray(cart.items)) {
    cart.items = [];
  }
}

function clampQtyForAdd(qty) {
  const n = Number(qty);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return null;
  return clampQty(n);
}

function lineKey(deviceId, variant) {
  return `${String(deviceId)}|${variantKey(variant)}`;
}

export const getCart = asyncHandler(async (req, res) => {
  const data = await buildCartResponse(req, req.user.id);
  return res.json(data);
});

export const addItem = asyncHandler(async (req, res) => {
  const { deviceId, productId, variant } = req.body || {};
  const pid = String(deviceId || productId || "");
  if (!pid) return res.status(400).json({ message: "deviceId is required" });

  const qty = clampQtyForAdd(req.body?.qty);
  if (!qty) return res.status(400).json({ message: "qty must be > 0" });

  // Out-of-stock is blocked on add
  const product = await loadDeviceOrThrow(pid);

  const cart = await getOrCreateCart(req.user.id);
  cart.lastUpdatedAt = new Date();

  const v = normVariant(variant);
  const k = lineKey(pid, v);

  const existing = cart.items.find((i) => {
    const dev = String(i.product);
    const vk = lineKey(dev, i.variant);
    return vk === k;
  });

  if (existing) {
    existing.qty = clampQty(Number(existing.qty || 0) + qty);
  } else {
    cart.items.push({
      product: pid,
      variant: v,
      qty,
      priceSnapshot: Number(product.price || 0),
    });
  }

  await assertCartWithinStock(cart);

  await cart.save();

  const data = await buildCartResponse(req, req.user.id);
  return res.json(data);
});

export const updateItem = asyncHandler(async (req, res) => {
  const id = String(req.params.id || "");
  if (!id) return res.status(400).json({ message: "id is required" });

  const qtyRaw = Number(req.body?.qty);
  if (!Number.isFinite(qtyRaw)) {
    return res.status(400).json({ message: "qty must be a number" });
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    const data = await buildCartResponse(req, req.user.id);
    return res.json(data);
  }

  // ✅ Defensive: guard against corrupted cart document
  ensureItems(cart);

  // ✅ Prefer true cart item id, fallback to product id for legacy carts
  const idxByItemId = cart.items.findIndex((i) => String(i._id) === id);
  const idxByProductId = cart.items.findIndex((i) => String(i.product) === id);
  const idx = idxByItemId !== -1 ? idxByItemId : idxByProductId;

  if (idx === -1) {
    const data = await buildCartResponse(req, req.user.id);
    return res.json(data);
  }

  if (qtyRaw <= 0) {
    cart.items.splice(idx, 1);
  } else {
    cart.items[idx].qty = clampQty(qtyRaw);
  }

  await assertCartWithinStock(cart);

  cart.lastUpdatedAt = new Date();
  await cart.save();

  const data = await buildCartResponse(req, req.user.id);
  return res.json(data);
});

export const removeItem = asyncHandler(async (req, res) => {
  const id = String(req.params.id || "");
  if (!id) return res.status(400).json({ message: "id is required" });

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    const data = await buildCartResponse(req, req.user.id);
    return res.json(data);
  }

  // ✅ Defensive: guard against corrupted cart document
  ensureItems(cart);

  const before = cart.items.length;

  // ✅ Prefer true cart item id, fallback to product id for legacy carts
  cart.items = cart.items.filter((i) => String(i._id) !== id && String(i.product) !== id);

  if (cart.items.length === before) {
    const data = await buildCartResponse(req, req.user.id);
    return res.json(data);
  }

  cart.lastUpdatedAt = new Date();
  await cart.save();

  const data = await buildCartResponse(req, req.user.id);
  return res.json(data);
});

// NOTE: mergeCart (guest cart merge) intentionally removed.
// Authentication is now mandatory. All cart operations require a valid session.

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (cart) {
    // ✅ Defensive: guard against corrupted cart document
    ensureItems(cart);
    cart.items = [];
    cart.lastUpdatedAt = new Date();
    await cart.save();
  }
  // If cart does not exist, return empty payload
  return res.json(emptyCartPayload());
});

export const markSeen = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (cart) {
    cart.lastSeenAt = new Date();
    await cart.save();
  }
  const data = await buildCartResponse(req, req.user.id);
  return res.json(data);
});

export const syncPrices = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart || !Array.isArray(cart.items)) {
    return res.json(await buildCartResponse(req, req.user.id));
  }

  const pids = cart.items.map((i) => i.product);
  const devices = await Device.find({ _id: { $in: pids } }).select("price");
  const priceMap = new Map(devices.map((d) => [String(d._id), d.price]));

  for (const item of cart.items) {
    const latest = priceMap.get(String(item.product));
    if (latest !== undefined) {
      item.priceSnapshot = Number(latest || 0);
    }
  }

  cart.lastUpdatedAt = new Date();
  await cart.save();

  const data = await buildCartResponse(req, req.user.id);
  return res.json(data);
});
