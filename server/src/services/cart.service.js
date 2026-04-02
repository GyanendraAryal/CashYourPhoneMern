import Cart from "../models/Cart.js";
import Device from "../models/Device.js";
import AppError from "../utils/AppError.js";
import { toPublicUploadUrl } from "../utils/upload.js";

const MAX_QTY = 5;
const CURRENCY = "NPR";

export function clampQty(qty) {
  const n = Number(qty || 1);
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_QTY, Math.max(1, Math.floor(n)));
}

export function normVariant(v) {
  const vv = v || {};
  return {
    storage: String(vv.storage || "").trim(),
    color: String(vv.color || "").trim(),
    condition: String(vv.condition || "").trim(),
  };
}

export function variantKey(v) {
  const x = normVariant(v);
  return `${x.storage}|${x.color}|${x.condition}`.toLowerCase();
}

/**
 * Fetch cart and shape it for the client.
 * NOTE: We project populated Device fields to avoid over-fetching.
 */
export async function buildCartResponse(req, userId) {
  const id = userId || req.user?.id;
  const cart = await Cart.findOne({ user: id }).populate({
    path: "items.product",
    select: "name thumbnail images price availability",
  });

  const itemsRaw = Array.isArray(cart?.items) ? cart.items : [];

  const items = itemsRaw.map((it) => {
    const p = it.product || {};

    const v = normVariant(it.variant);
    const pExist = Boolean(p && p._id);
    const outOfStock = pExist && String(p.availability || "").toLowerCase() === "out_of_stock";

    const unit = Number(it.priceSnapshot || p.price || 0);
    const qty = clampQty(it.qty);
    const lineTotal = unit * qty;

    const snapshot = Number(it.priceSnapshot || p.price || 0);
    const latest = Number(p.price || 0);

    return {
      // ✅ contract: cart line item id (the subdocument _id, not the product _id)
      id: String(it._id || p._id || it.product),

      deviceId: String(p._id || it.product),
      variant: v,

      qty,
      maxQty: MAX_QTY,

      nameSnapshot: it.nameSnapshot || p.name || "Unknown Device",
      thumbnailSnapshot: toPublicUploadUrl(req,
        p.thumbnail ||
        (Array.isArray(p.images) && p.images.length ? p.images[0] : "") ||
        "/phone-placeholder.png"
      ),

      unitPriceSnapshot: snapshot,
      latestUnitPrice: latest,
      priceChanged: pExist && snapshot !== latest,

      outOfStock,
      isDeleted: !pExist,
      // ✅ isOrderable: false when item can't be ordered (deleted or out of stock)
      isOrderable: pExist && !outOfStock,

      unitPrice: unit,
      lineTotal,
    };
  });

  const total = items.reduce((sum, it) => sum + Number(it.lineTotal || 0), 0);
  const count = items.reduce((sum, it) => sum + Number(it.qty || 0), 0);

  const lastUpdatedAt = cart?.lastUpdatedAt ? new Date(cart.lastUpdatedAt) : null;
  const lastSeenAt = cart?.lastSeenAt ? new Date(cart.lastSeenAt) : null;
  const unread = Boolean(lastUpdatedAt && (!lastSeenAt || lastUpdatedAt > lastSeenAt));

  const flags = {
    hasPriceChanges: items.some((i) => Boolean(i.priceChanged)),
    hasOutOfStock: items.some((i) => Boolean(i.outOfStock)),
    hasDeleted: items.some((i) => Boolean(i.isDeleted)),
  };
  flags.hasIssues = flags.hasPriceChanges || flags.hasOutOfStock || flags.hasDeleted;

  return {
    cart: { items, total, currency: CURRENCY, flags, lastUpdatedAt, lastSeenAt },
    count,
    unread,
  };
}

export async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

/**
 * Ensures total quantity per device across all cart lines does not exceed Device.quantity.
 */
export async function assertCartWithinStock(cart) {
  if (!cart?.items?.length) return;

  const byProduct = new Map();
  for (const it of cart.items) {
    const id = String(it.product);
    byProduct.set(id, (byProduct.get(id) || 0) + clampQty(it.qty));
  }

  for (const [pid, total] of byProduct) {
    const dev = await Device.findById(pid).select("quantity name availability");
    if (!dev) throw new AppError(`Product not found: ${pid}`, 404);
    if (String(dev.availability || "").toLowerCase() === "out_of_stock") {
      throw new AppError(`${dev.name || "Item"} is out of stock`, 400);
    }
    if (dev.quantity !== undefined && total > Number(dev.quantity)) {
      throw new AppError(
        `Insufficient stock for ${dev.name || "item"}: ${total} in cart, ${dev.quantity} available`,
        400
      );
    }
  }
}

export async function loadDeviceOrThrow(productId) {
  if (!productId) {
    const err = new Error("productId is required");
    err.statusCode = 400;
    throw err;
  }

  const product = await Device.findById(productId).select("price availability quantity name");
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  if (String(product.availability || "").toLowerCase() === "out_of_stock") {
    const err = new Error("Product is out of stock");
    err.statusCode = 400;
    throw err;
  }

  return product;
}

export function emptyCartPayload() {
  return {
    cart: { items: [], total: 0, currency: CURRENCY, flags: { hasPriceChanges: false, hasOutOfStock: false, hasIssues: false }, lastUpdatedAt: null, lastSeenAt: null },
    count: 0,
    unread: false,
  };
}
