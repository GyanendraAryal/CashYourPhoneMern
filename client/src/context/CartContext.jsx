import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import {
  addToCart as addToCartApi,
  clearCart as clearCartApi,
  getCart,
  markCartSeen,
  removeCartItem as removeCartItemApi,
  updateCartItem as updateCartItemApi,
  syncCartPrices as syncCartPricesApi,
} from "../services/cartService";

const CartContext = createContext(null);

const EMPTY = {
  items: [],
  total: 0,
  currency: "NPR",
  flags: { hasPriceChanges: false, hasOutOfStock: false, hasIssues: false },
  lastUpdatedAt: null,
  lastSeenAt: null,
};

const MAX_QTY = 5;

// Normalize variant fields — used for consistent API payloads
function normVariant(v) {
  const vv = v || {};
  return {
    storage: String(vv.storage || "").trim(),
    color: String(vv.color || "").trim(),
    condition: String(vv.condition || "").trim(),
  };
}

export function CartProvider({ children }) {
  const { user, booting } = useAuth();

  const [cart, setCart] = useState(EMPTY);
  const [count, setCount] = useState(0);
  const [cartUnread, setCartUnread] = useState(false);
  const [loading, setLoading] = useState(false);

  // Keep stable refs for user/booting so callbacks don't go stale
  const userRef = useRef(user);
  const bootingRef = useRef(booting);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { bootingRef.current = booting; }, [booting]);

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

  // ✅ Stable callback: reads user/booting from refs so [] deps is correct.
  // This prevents cascading re-renders on every consumer when user/booting change.
  const fetchCart = useCallback(async () => {
    if (bootingRef.current) return EMPTY;
    if (!userRef.current) {
      setCart(EMPTY);
      setCount(0);
      setCartUnread(false);
      return EMPTY;
    }

    setLoading(true);
    // NOTE: Do NOT setCart(EMPTY) here — it causes a flash of empty cart + stuck-empty
    // state if the follow-up GET fails. The loading indicator is sufficient feedback.
    try {
      const res = await getCart();
      setFromResponse(res);
      const data = res?.data || {};
      return data?.cart || EMPTY;
    } catch (e) {
      console.error("[CartContext] Refresh failed:", e);
      // Keep showing whatever cart was already loaded — don't wipe on a failed refresh
      return EMPTY;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync cart with authenticated user session
  useEffect(() => {
    (async () => {
      if (booting) return;
      if (!user) {
        setCart(EMPTY);
        setCount(0);
        setCartUnread(false);
        return;
      }
      await fetchCart();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, booting]);

  const actions = useMemo(() => {
    return {
      fetchCart,
      refreshCart: fetchCart, // alias for backwards compat

      markCartSeen: async () => {
        if (!userRef.current) return;
        const res = await markCartSeen();
        setFromResponse(res);
        return res;
      },
      markCartRead: async () => {
        if (!userRef.current) return;
        const res = await markCartSeen();
        setFromResponse(res);
        return res;
      },

      /**
       * addToCart(deviceId, qty, options?)
       * ✅ Updates state directly from response — no extra GET needed.
       */
      addToCart: async (deviceId, qty = 1, options = undefined) => {
        if (!userRef.current) {
          throw new Error("You must be logged in to add items to your cart.");
        }

        const id = String(deviceId);
        const v = normVariant(options?.variant);
        const res = await addToCartApi(id, qty, v);
        setFromResponse(res);
        return res?.data?.cart || EMPTY;
      },

      /**
       * ✅ KEY FIX: Updates cart state directly from PATCH response.
       * Previously: cleared cart → re-fetched (if refetch failed, cart went empty).
       * Now: PATCH returns full cart, apply it straight to state. Instant + reliable.
       */
      updateCartItem: async (itemId, qty) => {
        if (!userRef.current) return;
        const res = await updateCartItemApi(itemId, qty);
        setFromResponse(res);
        return res?.data?.cart || EMPTY;
      },

      /**
       * ✅ Same fix: use DELETE response directly, no extra GET.
       */
      removeCartItem: async (itemId) => {
        if (!userRef.current) return;
        const res = await removeCartItemApi(itemId);
        setFromResponse(res);
        return res?.data?.cart || EMPTY;
      },

      /**
       * ✅ clearCart: use DELETE /cart response directly.
       */
      clearCart: async () => {
        if (!userRef.current) return;
        const res = await clearCartApi();
        setFromResponse(res);
        return res?.data?.cart || EMPTY;
      },

      syncPrices: async () => {
        if (!userRef.current) return;
        setLoading(true);
        try {
          const res = await syncCartPricesApi();
          setFromResponse(res);
          return res;
        } finally {
          setLoading(false);
        }
      },
    };
  // fetchCart is intentionally stable via useRef pattern, [] dep is correct
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
