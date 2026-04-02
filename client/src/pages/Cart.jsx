import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

function money(n) {
  const v = Number(n || 0);
  return Number.isFinite(v) ? v.toLocaleString("en-NP") : "0";
}

function CartIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
    </svg>
  );
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
    syncPrices,
  } = useCart();

  const [syncing, setSyncing] = useState(false);
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
  const total = Number(cart?.total || 0);
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

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await syncPrices();
      toast.success("Prices updated to match current catalog.");
    } catch (e) {
      toast.error(e?.message || "Failed to sync prices.");
    } finally {
      setSyncing(false);
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

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 pb-24 md:pb-8 min-h-[60vh]">
      {/* Shared Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Cart</h1>
          <p className="text-sm text-text-muted mt-1.5 font-medium">
            {!user ? "Please login to view your cart" : loading ? "Updating items..." : `${count || 0} item(s) in your bag`}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/buy"
            className="px-5 py-2.5 rounded-xl border border-border-muted text-text-primary font-bold hover:bg-surface-white-subtle transition-all active:scale-95"
          >
            Continue shopping
          </Link>

          {user && hasItems && (
            <button
              type="button"
              onClick={onClear}
              disabled={busyId === "clear" || loading}
              className="px-5 py-2.5 rounded-xl bg-surface-white-subtle text-text-primary font-bold hover:bg-surface-white-subtle/70 disabled:opacity-60 transition-all active:scale-95"
            >
              {busyId === "clear" ? "Clearing..." : "Clear cart"}
            </button>
          )}
        </div>
      </div>

      {/* Price Alert Banner */}
      {user && cart?.flags?.hasPriceChanges && (
        <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 transition-all animate-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-yellow-900 text-sm">Price updates detected</h3>
                <p className="text-yellow-700 text-xs mt-0.5">Some items in your cart have new prices in our catalog. Tap sync to update.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="w-full sm:w-auto px-6 py-2 rounded-xl bg-yellow-700 text-white font-bold text-sm shadow-sm hover:bg-yellow-800 transition-all active:scale-95 disabled:opacity-60"
            >
              {syncing ? "Syncing..." : "Sync Cart Prices"}
            </button>
          </div>
        </div>
      )}

      {!user ? (
        <div className="rounded-2xl border border-border-muted bg-white p-12 text-center shadow-sm">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-extrabold text-text-primary">Login required</h2>
            <p className="mt-3 text-text-muted leading-relaxed">
              Your cart is waiting! Please log in to see your items and proceed to checkout.
            </p>
            <div className="mt-8">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-primary-blue-active text-white font-extrabold shadow-md hover:opacity-90 transition-all active:scale-95"
              >
                Login to continue
              </Link>
            </div>
          </div>
        </div>
      ) : !loading && !hasItems ? (
        <div className="rounded-2xl border border-border-muted bg-white p-12 text-center shadow-sm">
          <div className="max-w-md mx-auto">
            <div className="mx-auto w-16 h-16 bg-primary-blue-muted/10 rounded-full flex items-center justify-center mb-6">
               <CartIcon className="w-8 h-8 text-primary-blue-active" />
            </div>
            <h2 className="text-xl font-extrabold text-text-primary">Your cart is empty</h2>
            <p className="mt-3 text-text-muted leading-relaxed">
              Looks like you haven't added anything yet. Explore our wide range of premium devices and find your perfect match.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/buy"
                className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-primary-blue-active text-white font-extrabold shadow-md hover:opacity-90 transition-all active:scale-95"
              >
                Start Shopping
              </Link>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="px-8 py-3 rounded-xl border border-border-muted text-text-primary font-bold hover:bg-surface-white-subtle transition-all active:scale-95"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start animate-in fade-in duration-500">
          {/* Items List */}
          <div className="space-y-4">
            <div className="hidden md:grid grid-cols-[72px_1fr_170px_90px] gap-6 px-2 text-xs font-bold text-text-muted uppercase tracking-widest">
              <div />
              <div>Product Details</div>
              <div className="text-center">Quantity</div>
              <div className="text-right">Subtotal</div>
            </div>

            <div className="space-y-4 md:max-h-[65vh] md:overflow-y-auto md:pr-2 custom-scrollbar">
              {loading ? (
                <>
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
                  const maxQty = Number(it.maxQty || 5);
                  const isBusy = busyId === lineId;
                  // Disable +/- when request is in flight OR the item is unavailable
                  const canOrder = it.isOrderable !== false && !it.isDeleted;
                  const disabled = isBusy || !canOrder;
                  const disableInc = isBusy || !canOrder || qty >= maxQty;

                  return (
                    <div
                      key={lineId}
                      className="grid grid-cols-[64px_1fr_auto] md:grid-cols-[72px_1fr_170px_90px] gap-4 md:gap-6 items-start md:items-center rounded-2xl border border-border-muted bg-white p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 group"
                    >
                      <img
                        src={it.thumbnailSnapshot || "/phone-placeholder.png"}
                        alt={it.nameSnapshot || "Device"}
                        className="h-16 w-16 md:h-18 md:w-18 rounded-xl object-cover border border-border-muted bg-surface-white-subtle group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-text-primary truncate group-hover:text-primary-blue-active transition-colors">
                              {it.nameSnapshot || "Device"}
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-muted">
                              <span>{currency} {money(unitPrice)}</span>
                            {it.priceChanged && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 text-yellow-800 px-2 py-0.5 text-[10px] font-black uppercase ring-1 ring-yellow-100">
                                Updated
                              </span>
                            )}
                            {it.isOrderable === false || it.isDeleted ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-800 px-2 py-0.5 text-[10px] font-black uppercase ring-1 ring-red-100">
                                No longer available
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemove(it)}
                          disabled={disabled}
                          className="md:hidden text-xs font-bold text-text-muted hover:text-danger-red transition-colors"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Info warning for deleted */}
                      {(it.isOrderable === false || it.isDeleted) && (
                        <div className="mt-2 text-xs text-danger-red font-bold animate-pulse">
                          This item was removed from our catalog. Please remove it from your cart to proceed.
                        </div>
                      )}

                        {/* Mobile controls */}
                        <div className="mt-4 md:hidden flex items-center justify-between">
                          <div className="inline-flex items-center gap-2 rounded-xl border border-border-muted bg-white p-1">
                            <button
                              type="button"
                              onClick={() => onDec(it)}
                              disabled={disabled}
                              className="h-8 w-8 rounded-lg hover:bg-surface-white-subtle font-bold disabled:opacity-40"
                            >
                              −
                            </button>
                            <span className="min-w-[20px] text-center font-black">{qty}</span>
                            <button
                              type="button"
                              onClick={() => onInc(it)}
                              disabled={disableInc}
                              className="h-8 w-8 rounded-lg hover:bg-surface-white-subtle font-bold disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] uppercase font-bold text-text-muted leading-tight">Total</div>
                            <div className="font-black text-text-primary leading-tight">
                              {currency} {money(lineTotal)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop controls */}
                      <div className="hidden md:flex items-center justify-center">
                        <div className="inline-flex items-center gap-3 rounded-xl border border-border-muted bg-white p-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => onDec(it)}
                            disabled={disabled}
                            className="h-9 w-9 rounded-lg hover:bg-primary-blue-muted/20 text-text-primary transition-colors font-bold disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="min-w-[24px] text-center font-black text-sm">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => onInc(it)}
                            disabled={disableInc}
                            className="h-9 w-9 rounded-lg hover:bg-primary-blue-muted/20 text-text-primary transition-colors font-bold disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="hidden md:flex flex-col items-end gap-1">
                        <div className="font-black text-text-primary text-base">
                          {currency} {money(lineTotal)}
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemove(it)}
                          disabled={disabled}
                          className="text-[11px] font-bold text-text-muted hover:text-danger-red transition-colors flex items-center gap-1 group/rem"
                        >
                          <span className="opacity-0 group-hover/rem:opacity-100 transition-opacity">×</span> Remove
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sticky Summary */}
          <div className="hidden lg:block sticky top-24">
            <div className="rounded-2xl border border-border-muted bg-white p-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Order Summary</h2>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted font-medium">Bag Total</span>
                  <span className="font-bold text-text-primary">
                    {currency} {money(total)}
                  </span>
                </div>

                <div className="h-px bg-border-muted/60" />

                <div className="flex items-center justify-between">
                  <span className="text-text-primary font-bold">Total Amount</span>
                  <div className="text-right">
                    <div className="text-xl font-black text-primary-blue-active">
                      {currency} {money(total)}
                    </div>
                    <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Including VAT</div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={goCheckout}
                disabled={!hasItems || loading}
                className="mt-8 w-full rounded-xl bg-primary-blue-active text-white font-black py-4 shadow-lg shadow-primary-blue-active/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
              >
                Proceed to Checkout
              </button>

              <div className="mt-6 flex items-start gap-3 p-3 rounded-xl bg-surface-white-subtle text-[11px] text-text-muted leading-relaxed font-medium">
                <svg className="w-4 h-4 shrink-0 mt-0.5 text-primary-blue-active" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m12-3V7a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2z" />
                </svg>
                Secure transaction. Prices and availability are subject to change until your order is confirmed.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Footer */}
      {user && hasItems && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border-muted bg-white/95 backdrop-blur-md z-40 animate-in slide-in-from-bottom duration-300">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-6">
            <div>
              <div className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Total</div>
              <div className="text-xl font-black text-primary-blue-active leading-none">
                {currency} {money(total)}
              </div>
            </div>
            <button
              type="button"
              onClick={goCheckout}
              disabled={!hasItems || loading}
              className="flex-1 rounded-xl bg-primary-blue-active text-white font-black py-3.5 shadow-lg shadow-primary-blue-active/10 hover:opacity-90 active:scale-95 transition-all text-sm"
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
