import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  addToCart as addToCartApi,
  clearCart as clearCartApi,
  getCart,
  markCartSeen,
  mergeCart as mergeCartApi,
  removeCartItem as removeCartItemApi,
  updateCartItem as updateCartItemApi,
} from "../services/cartService";

const CartContext = createContext(null);

const EMPTY = {
  items: [],
  subtotal: 0,
  currency: "NPR",
  flags: { hasPriceChanges: false, hasOutOfStock: false, hasIssues: false },
  lastUpdatedAt: null,
  lastSeenAt: null,
};

const GUEST_KEY = "cyp_guest_cart_v1";
const MAX_QTY = 5;

function normVariant(v) {
  const vv = v || {};
  return {
    storage: String(vv.storage || "").trim(),
    color: String(vv.color || "").trim(),
    condition: String(vv.condition || "").trim(),
  };
}

function variantKey(v) {
  const x = normVariant(v);
  return `${x.storage}|${x.color}|${x.condition}`.toLowerCase();
}

function guestItemId(deviceId, variant) {
  return `${String(deviceId)}|${variantKey(variant)}`;
}

function clampQty(qty) {
  const n = Number(qty || 1);
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_QTY, Math.max(1, Math.floor(n)));
}

function loadGuestItems() {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveGuestItems(items) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function buildGuestCart(items) {
  const safe = Array.isArray(items) ? items : [];
  const subtotal = safe.reduce((sum, it) => {
    const qty = clampQty(it?.qty);
    const unit = Number(it?.unitPriceSnapshot || 0);
    return sum + unit * qty;
  }, 0);

  const count = safe.reduce((sum, it) => sum + clampQty(it?.qty), 0);

  return {
    cart: {
      ...EMPTY,
      items: safe.map((it) => {
        const qty = clampQty(it?.qty);
        const unit = Number(it?.unitPriceSnapshot || 0);
        return {
          id: String(it?.id || guestItemId(it?.deviceId, it?.variant)),
          deviceId: String(it?.deviceId || ""),
          variant: normVariant(it?.variant),
          qty,
          maxQty: MAX_QTY,

          nameSnapshot: String(it?.nameSnapshot || "Device"),
          thumbnailSnapshot: String(it?.thumbnailSnapshot || "/phone-placeholder.png"),

          unitPriceSnapshot: unit,
          latestUnitPrice: unit,
          priceChanged: false,

          outOfStock: false,

          unitPrice: unit,
          lineTotal: unit * qty,
        };
      }),
      subtotal,
      currency: "NPR",
      flags: { hasPriceChanges: false, hasOutOfStock: false, hasIssues: false },
      lastUpdatedAt: null,
      lastSeenAt: null,
    },
    count,
    unread: false,
  };
}

export function CartProvider({ children }) {
  const { user } = useAuth();

  const [cart, setCart] = useState(EMPTY);
  const [count, setCount] = useState(0);
  const [cartUnread, setCartUnread] = useState(false);
  const [loading, setLoading] = useState(false);

  const mergedOnceRef = useRef(false);

  function setFromResponse(res) {
    const data = res?.data || {};
    const nextCart = data?.cart || EMPTY;

    const nextCount =
      typeof data?.count === "number"
        ? data.count
        : (nextCart.items || []).reduce((s, it) => s + Number(it?.qty || 0), 0);

    setCart(nextCart);
    setCount(Number.isFinite(nextCount) ? nextCount : 0);

    if (typeof data?.unread === "boolean") setCartUnread(data.unread);
    else setCartUnread(false);
  }

  const refreshCart = async () => {
    // Guest cart (localStorage)
    if (!user) {
      const guestItems = loadGuestItems();
      const res = buildGuestCart(guestItems);
      setFromResponse({ data: res });
      return;
    }

    setLoading(true);
    try {
      const res = await getCart();
      setFromResponse(res);
    } finally {
      setLoading(false);
    }
  };

  // Merge guest -> server exactly once after login
  useEffect(() => {
    (async () => {
      if (!user?.id) {
        mergedOnceRef.current = false;
        await refreshCart();
        return;
      }

      // If guest items exist, merge once per login session
      if (!mergedOnceRef.current) {
        const guestItems = loadGuestItems();
        if (guestItems.length) {
          try {
            mergedOnceRef.current = true;
            const mergePayload = guestItems.map((it) => ({
              deviceId: String(it.deviceId),
              qty: clampQty(it.qty),
              variant: normVariant(it.variant),
            }));
            const res = await mergeCartApi(mergePayload);
            saveGuestItems([]); // clear guest cart after merge
            setFromResponse(res);
            return;
          } catch {
            // If merge fails, fall back to server cart fetch
          }
        }
      }

      await refreshCart();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const actions = useMemo(() => {
    return {
      refreshCart,

      markCartSeen: async () => {
        if (!user) return;
        const res = await markCartSeen();
        setFromResponse(res);
        return res;
      },
      markCartRead: async () => {
        if (!user) return;
        const res = await markCartSeen();
        setFromResponse(res);
        return res;
      },

      /**
       * addToCart(deviceId, qty, options?)
       * options:
       * - variant: { storage, color, condition }
       * - meta: { nameSnapshot, thumbnailSnapshot, unitPriceSnapshot }
       */
      addToCart: async (deviceId, qty = 1, options = undefined) => {
        const id = String(deviceId);
        const v = normVariant(options?.variant);

        // Guest cart path
        if (!user) {
          const guestItems = loadGuestItems();
          const k = guestItemId(id, v);

          const meta = options?.meta || {};
          const nameSnapshot = String(meta.nameSnapshot || "Device");
          const thumbnailSnapshot = String(meta.thumbnailSnapshot || "/phone-placeholder.png");
          const unitPriceSnapshot = Number(meta.unitPriceSnapshot || 0);

          const existing = guestItems.find((x) => String(x.id) === k);
          if (existing) {
            existing.qty = clampQty(Number(existing.qty || 0) + clampQty(qty));
          } else {
            guestItems.push({
              id: k,
              deviceId: id,
              variant: v,
              qty: clampQty(qty),
              nameSnapshot,
              thumbnailSnapshot,
              unitPriceSnapshot,
            });
          }

          saveGuestItems(guestItems);
          const res = buildGuestCart(guestItems);
          setFromResponse({ data: res });
          return { data: res };
        }

        // Logged-in: server DB cart
        const res = await addToCartApi(id, qty, v);
        setFromResponse(res);
        return res;
      },

      updateCartItem: async (itemId, qty) => {
        // Guest cart path
        if (!user) {
          const id = String(itemId);
          const guestItems = loadGuestItems();
          const idx = guestItems.findIndex((x) => String(x.id) === id || String(x.deviceId) === id);
          if (idx === -1) return { data: buildGuestCart(guestItems) };

          const q = Number(qty);
          if (!Number.isFinite(q)) return { data: buildGuestCart(guestItems) };

          if (q <= 0) guestItems.splice(idx, 1);
          else guestItems[idx].qty = clampQty(q);

          saveGuestItems(guestItems);
          const res = buildGuestCart(guestItems);
          setFromResponse({ data: res });
          return { data: res };
        }

        const res = await updateCartItemApi(itemId, qty);
        setFromResponse(res);
        return res;
      },

      removeCartItem: async (itemId) => {
        if (!user) {
          const id = String(itemId);
          const guestItems = loadGuestItems().filter((x) => String(x.id) !== id && String(x.deviceId) !== id);
          saveGuestItems(guestItems);
          const res = buildGuestCart(guestItems);
          setFromResponse({ data: res });
          return { data: res };
        }

        const res = await removeCartItemApi(itemId);
        setFromResponse(res);
        return res;
      },

      clearCart: async () => {
        if (!user) {
          saveGuestItems([]);
          const res = buildGuestCart([]);
          setFromResponse({ data: res });
          return { data: res };
        }

        const res = await clearCartApi();
        if (res?.data?.cart) setFromResponse(res);
        else {
          setCart(EMPTY);
          setCount(0);
          setCartUnread(false);
        }
        return res;
      },
    };
  }, [user?.id]);

  const value = useMemo(
    () => ({ cart, count, cartUnread, loading, ...actions }),
    [cart, count, cartUnread, loading, actions]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
