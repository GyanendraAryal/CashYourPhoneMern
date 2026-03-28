import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

function money(n) {
  const v = Number(n || 0);
  return Number.isFinite(v) ? v.toLocaleString("en-NP") : "0";
}

function CartRowSkeleton() {
  return (
    <div className="grid grid-cols-[64px_1fr_auto] md:grid-cols-[72px_1fr_170px_90px] gap-4 items-center rounded-2xl border border-border-muted bg-white p-4">
      <div className="h-16 w-16 md:h-18 md:w-18 rounded-xl bg-surface-white-subtle animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-2/3 rounded bg-surface-white-subtle animate-pulse" />
        <div className="h-3 w-1/3 rounded bg-surface-white-subtle animate-pulse" />
      </div>
      <div className="hidden md:block">
        <div className="h-9 w-32 rounded-xl bg-surface-white-subtle animate-pulse" />
      </div>
      <div className="hidden md:block">
        <div className="h-5 w-16 rounded bg-surface-white-subtle animate-pulse" />
      </div>
    </div>
  );
}

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    cart,
    count,
    loading,
    markCartSeen,
    markCartRead, // backwards compatibility
    updateCartItem,
    removeCartItem,
    clearCart,
  } = useCart();

  const [busyId, setBusyId] = useState(null);

  // ✅ Mark cart as seen on page view (server-truth)
  useEffect(() => {
    (async () => {
      try {
        if (markCartSeen) await markCartSeen();
        else if (markCartRead) await markCartRead();
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = cart?.items || [];
  const subtotal = Number(cart?.subtotal || 0);
  const currency = cart?.currency || "NPR";

  const hasItems = items.length > 0;

  const onInc = async (it) => {
    const id = it?.id;
    const qty = Number(it?.qty || 0) + 1;
    if (!id) return;

    try {
      setBusyId(id);
      await updateCartItem(id, qty);
    } catch (e) {
      toast.error(e?.message || "Failed to update cart");
    } finally {
      setBusyId(null);
    }
  };

  const onDec = async (it) => {
    const id = it?.id;
    const current = Number(it?.qty || 0);
    const qty = current - 1;
    if (!id) return;

    try {
      setBusyId(id);
      if (qty <= 0) await removeCartItem(id);
      else await updateCartItem(id, qty);
    } catch (e) {
      toast.error(e?.message || "Failed to update cart");
    } finally {
      setBusyId(null);
    }
  };

  const onRemove = async (it) => {
    const id = it?.id;
    if (!id) return;

    try {
      setBusyId(id);
      await removeCartItem(id);
      toast.success("Removed");
    } catch (e) {
      toast.error(e?.message || "Failed to remove item");
    } finally {
      setBusyId(null);
    }
  };

  const onClear = async () => {
    try {
      setBusyId("clear");
      await clearCart();
      toast.success("Cart cleared");
    } catch (e) {
      toast.error(e?.message || "Failed to clear cart");
    } finally {
      setBusyId(null);
    }
  };

  const goCheckout = () => {
    if (!hasItems) return;

    const hasIssues = Boolean(cart?.flags?.hasIssues);
    if (hasIssues) {
      toast.error("Fix cart issues (price changes / out of stock) before checkout.");
      return;
    }

    if (!user) {
      toast.error("Please login to checkout.");
      navigate("/login");
      return;
    }

    navigate("/checkout");
  };

  // --- Guard
  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <div className="rounded-2xl border border-border-muted bg-white p-6">
          <h1 className="text-xl font-extrabold text-text-primary">Your Cart</h1>
          <p className="mt-2 text-text-muted">Please login to view your cart.</p>
          <div className="mt-5 flex gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl bg-primary-blue-active text-white font-semibold"
            >
              Login
            </Link>
            <Link
              to="/buy"
              className="px-4 py-2 rounded-xl border border-border-muted text-text-primary font-semibold"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Empty state
  if (!loading && !hasItems) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <div className="rounded-2xl border border-border-muted bg-white p-6">
          <h1 className="text-2xl font-extrabold text-text-primary">Cart</h1>
          <p className="mt-2 text-text-muted">
            Your cart is empty. Add something you like and it will show up here.
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              to="/buy"
              className="px-4 py-2 rounded-xl bg-primary-blue-active text-white font-semibold"
            >
              Browse devices
            </Link>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-4 py-2 rounded-xl border border-border-muted text-text-primary font-semibold hover:bg-surface-white-subtle"
            >
              Back home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">Cart</h1>
          <p className="text-sm text-text-muted mt-1">
            {loading ? "Loading..." : `${count || 0} item(s)`}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/buy"
            className="px-4 py-2 rounded-xl border border-border-muted text-text-primary font-semibold hover:bg-surface-white-subtle"
          >
            Continue shopping
          </Link>

          <button
            type="button"
            onClick={onClear}
            disabled={busyId === "clear" || loading}
            className="px-4 py-2 rounded-xl bg-surface-white-subtle text-text-primary font-semibold hover:bg-surface-white-subtle/70 disabled:opacity-60"
          >
            {busyId === "clear" ? "Clearing..." : "Clear cart"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Items (scrollable list) */}
        <div className="space-y-3">
          <div className="hidden md:grid grid-cols-[72px_1fr_170px_90px] gap-4 px-1 text-xs font-bold text-text-muted uppercase tracking-wide">
            <div />
            <div>Item</div>
            <div className="text-center">Quantity</div>
            <div className="text-right">Subtotal</div>
          </div>

          <div className="space-y-3 md:max-h-[60vh] md:overflow-y-auto md:pr-1">
            {loading ? (
              <>
                <CartRowSkeleton />
                <CartRowSkeleton />
                <CartRowSkeleton />
                <CartRowSkeleton />
              </>
            ) : (
              items.map((it) => {
                const lineId = String(it.id ?? it.deviceId);
                const qty = Number(it.qty || 0);
                const unitPrice = Number(it.unitPrice || 0);
                const lineTotal = Number(it.lineTotal || unitPrice * qty);
                const disabled = busyId === lineId;

                return (
                  <div
                    key={lineId}
                    className="grid grid-cols-[64px_1fr_auto] md:grid-cols-[72px_1fr_170px_90px] gap-4 items-start md:items-center rounded-2xl border border-border-muted bg-white p-4"
                  >
                    <img
                      src={it.thumbnailSnapshot || "/phone-placeholder.png"}
                      alt={it.nameSnapshot || "Device"}
                      className="h-16 w-16 md:h-18 md:w-18 rounded-xl object-cover border border-border-muted bg-surface-white-subtle"
                      loading="lazy"
                    />

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-text-primary truncate">
                            {it.nameSnapshot || "Device"}
                          </h3>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-muted">
                            <span>{currency} {money(unitPrice)}</span>
                            {it.priceChanged ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 text-yellow-800 px-2 py-0.5 text-xs font-bold ring-1 ring-yellow-100">
                                Price updated
                              </span>
                            ) : null}
                          </div>

                          {it.priceChanged ? (
                            <p className="mt-1 text-xs text-text-muted">
                              Latest price: <span className="font-semibold">{currency} {money(it.latestUnitPrice)}</span>
                            </p>
                          ) : null}
                        </div>

                        {/* Remove (mobile) */}
                        <button
                          type="button"
                          onClick={() => onRemove(it)}
                          disabled={disabled}
                          className="md:hidden text-sm font-bold text-text-muted hover:text-danger-red disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Quantity (mobile) */}
                      <div className="mt-3 md:hidden flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-border-muted bg-white p-1">
                          <button
                            type="button"
                            onClick={() => onDec(it)}
                            disabled={disabled}
                            className="h-9 w-9 rounded-lg hover:bg-surface-white-subtle disabled:opacity-60"
                          >
                            −
                          </button>
                          <span className="min-w-[24px] text-center font-extrabold">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => onInc(it)}
                            disabled={disabled}
                            className="h-9 w-9 rounded-lg hover:bg-surface-white-subtle disabled:opacity-60"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-text-muted">Subtotal</div>
                          <div className="font-extrabold text-text-primary">
                            {currency} {money(lineTotal)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quantity (desktop) */}
                    <div className="hidden md:flex items-center justify-center">
                      <div className="inline-flex items-center gap-2 rounded-xl border border-border-muted bg-white p-1">
                        <button
                          type="button"
                          onClick={() => onDec(it)}
                          disabled={disabled}
                          className="h-9 w-9 rounded-lg hover:bg-surface-white-subtle disabled:opacity-60"
                        >
                          −
                        </button>
                        <span className="min-w-[24px] text-center font-extrabold">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onInc(it)}
                          disabled={disabled}
                          className="h-9 w-9 rounded-lg hover:bg-surface-white-subtle disabled:opacity-60"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Line subtotal + remove (desktop) */}
                    <div className="hidden md:flex flex-col items-end gap-2">
                      <div className="font-extrabold text-text-primary">
                        {currency} {money(lineTotal)}
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(it)}
                        disabled={disabled}
                        className="text-sm font-bold text-text-muted hover:text-danger-red disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Summary (sticky desktop) */}
        <div className="hidden lg:block sticky top-20">
          <div className="rounded-2xl border border-border-muted bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-text-primary">Summary</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Subtotal</span>
                <span className="font-extrabold text-text-primary">
                  {currency} {money(subtotal)}
                </span>
              </div>

              <div className="h-px bg-border-muted" />

              <div className="flex items-center justify-between">
                <span className="text-text-muted">Total</span>
                <span className="text-lg font-extrabold text-text-primary">
                  {currency} {money(subtotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={goCheckout}
              disabled={!hasItems || loading}
              className="mt-5 w-full rounded-xl bg-primary-blue-active text-white font-extrabold py-3 hover:bg-primary-blue-hover disabled:opacity-60"
            >
              Checkout
            </button>

            <p className="mt-3 text-xs text-text-muted">
              Totals are calculated on the server for safety. Prices may change until checkout.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile sticky/bottom summary */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border-muted bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-text-muted">Total</div>
            <div className="text-lg font-extrabold text-text-primary">
              {currency} {money(subtotal)}
            </div>
          </div>
          <button
            type="button"
            onClick={goCheckout}
            disabled={!hasItems || loading}
            className="rounded-xl bg-primary-blue-active text-white font-extrabold px-5 py-3 hover:bg-primary-blue-hover disabled:opacity-60"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
