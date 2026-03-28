import api from "../lib/api";

/**
 * Response normalizer:
 * Supports common backend shapes:
 * 1) { cart: { items, subtotal, currency }, count }
 * 2) { items, subtotal, currency } (raw cart)
 * 3) { cart: rawCart } with no count
 */
function normalizeCartResponse(res) {
  const data = res?.data || {};
  const cart = data.cart || data || { items: [], subtotal: 0, currency: "NPR" };

  const items = Array.isArray(cart?.items) ? cart.items : [];
  const count =
    typeof data?.count === "number"
      ? data.count
      : items.reduce((sum, it) => sum + Number(it?.qty || 0), 0);

  const unread = typeof data?.unread === "boolean" ? data.unread : undefined;

  return { cart: { ...cart, items }, count, unread };
}

export async function getCart() {
  const res = await api.get("/api/v1/cart");
  const norm = normalizeCartResponse(res);
  return { ...res, data: { ...res.data, ...norm } };
}

/**
 * Adds a device to cart.
 * Server supports both deviceId + productId, but we standardize on deviceId.
 * Optional: variant { storage, color, condition }
 */
export async function addToCart(deviceId, qty = 1, variant = undefined) {
  const id = String(deviceId);
  const body = { deviceId: id, qty };
  if (variant) body.variant = variant;

  const res = await api.post("/api/v1/cart/items", body);
  const norm = normalizeCartResponse(res);
  return { ...res, data: { ...res.data, ...norm } };
}

/**
 * Updates qty for a cart LINE ITEM.
 * URL param is the cart item's id (or deviceId fallback for legacy carts).
 */
export async function updateCartItem(itemId, qty) {
  const id = String(itemId);
  const res = await api.patch(`/api/v1/cart/items/${id}`, { qty });
  const norm = normalizeCartResponse(res);
  return { ...res, data: { ...res.data, ...norm } };
}

export async function removeCartItem(itemId) {
  const id = String(itemId);
  const res = await api.delete(`/api/v1/cart/items/${id}`);
  const norm = normalizeCartResponse(res);
  return { ...res, data: { ...res.data, ...norm } };
}

export async function mergeCart(items) {
  const res = await api.post("/api/v1/cart/merge", { items });
  const norm = normalizeCartResponse(res);
  return { ...res, data: { ...res.data, ...norm } };
}

export async function clearCart() {
  const res = await api.delete("/api/v1/cart");
  try {
    const norm = normalizeCartResponse(res);
    return { ...res, data: { ...res.data, ...norm } };
  } catch {
    return res;
  }
}

export async function markCartSeen() {
  const res = await api.post("/api/v1/cart/mark-seen");
  const norm = normalizeCartResponse(res);
  return { ...res, data: { ...res.data, ...norm } };
}
