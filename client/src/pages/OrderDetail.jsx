import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { cancelOrder, getOrder } from "../services/orderService";
import ConfirmModal from "../components/ConfirmModal";

function money(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("en-NP");
}

function normalizeStatus(s) {
  return String(s || "").toLowerCase().trim();
}

function statusPillClass(status) {
  const s = normalizeStatus(status);

  if (s === "cancelled" || s === "canceled")
    return "bg-secondary-violet-muted/15 text-secondary-violet-active ring-1 ring-secondary-violet-muted/30";
  if (s === "delivered" || s === "completed")
    return "bg-green-50 text-green-700 ring-1 ring-green-100";
  if (s === "shipped")
    return "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
  if (s === "created")
    return "bg-primary-blue-muted/15 text-primary-blue-active ring-1 ring-primary-blue-muted/30";

  return "bg-gray-50 text-gray-700 ring-1 ring-gray-200";
}

export default function OrderDetail() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [order, setOrder] = useState(null);

  const [cancelling, setCancelling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canCancel = useMemo(() => {
    return !!order && normalizeStatus(order.status) === "created";
  }, [order]);

  const items = order?.items || [];
  const computedSubtotal = useMemo(() => {
    return items.reduce((sum, it) => {
      const line = Number(it?.price || 0) * Number(it?.qty || 0);
      return sum + (Number.isFinite(line) ? line : 0);
    }, 0);
  }, [items]);

  const displayTotal = order?.total ?? computedSubtotal;

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const orderDoc = await getOrder(id);
        if (mounted) setOrder(orderDoc || null);
      } catch (e) {
        const msg = e?.message || e?.response?.data?.message || "Failed to load order.";
        if (mounted) {
          setErr(msg);
          toast.error(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  const doCancel = async () => {
    if (!canCancel || cancelling) return;

    setCancelling(true);
    try {
      const updated = await cancelOrder(id);
      setOrder(updated || null);
      toast.success("Order cancelled.");
      setConfirmOpen(false);
    } catch (e) {
      toast.error(e?.message || e?.response?.data?.message || "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary">
            Order Details
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            View summary, contact info, and items in this order.
          </p>
        </div>

        <Link
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-border-muted bg-white px-4 py-2 text-sm font-semibold text-text-primary shadow-sm hover:opacity-95"
          to="/my-orders"
        >
          ← Back to My Orders
        </Link>
      </div>

      {/* States */}
      {loading ? (
        <div className="rounded-2xl border border-border-muted bg-white p-5 shadow-sm">
          <div className="h-4 w-44 animate-pulse rounded bg-gray-100" />
          <div className="mt-3 h-3 w-72 animate-pulse rounded bg-gray-100" />
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
          </div>
          <div className="mt-6 h-40 animate-pulse rounded-xl bg-gray-100" />
        </div>
      ) : err ? (
        <div className="rounded-2xl border border-border-muted bg-white p-5 text-sm text-primary-blue-active shadow-sm">
          {err}
        </div>
      ) : !order ? (
        <div className="rounded-2xl border border-border-muted bg-white p-5 text-sm text-text-muted shadow-sm">
          Order not found.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="rounded-2xl border border-border-muted bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm text-text-muted">Order</div>
                <div className="mt-1 truncate text-base font-extrabold text-text-primary">
                  #{order.orderNumber || order._id || id}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">Status</span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${statusPillClass(
                    order.status
                  )}`}
                >
                  {order.status || "—"}
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border-muted bg-white p-4">
                <div className="text-xs font-semibold text-text-muted">
                  Total
                </div>
                <div className="mt-1 text-lg font-extrabold text-text-primary">
                  Rs {money(displayTotal)}
                </div>
                <div className="mt-1 text-xs text-text-muted">
                  Subtotal: Rs {money(computedSubtotal)}
                </div>
              </div>

              <div className="rounded-2xl border border-border-muted bg-white p-4">
                <div className="text-xs font-semibold text-text-muted">
                  Payment
                </div>
                <div className="mt-1 text-base font-bold text-text-primary">
                  {order.paymentStatus || "unpaid"}
                </div>
                <div className="mt-1 text-xs text-text-muted">
                  Method: {order.paymentMethod || "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-border-muted bg-white p-4">
                <div className="text-xs font-semibold text-text-muted">
                  Items
                </div>
                <div className="mt-1 text-base font-bold text-text-primary">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </div>
                <div className="mt-1 text-xs text-text-muted">
                  Review below
                </div>
              </div>
            </div>
          </div>

          {/* Contact Card */}
          <div className="rounded-2xl border border-border-muted bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-base font-extrabold text-text-primary">
                  Contact & Delivery
                </div>
                <div className="mt-1 text-sm text-text-muted">
                  Who to contact and where to deliver.
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-border-muted bg-white p-4">
                <div className="text-xs font-semibold text-text-muted">
                  Customer
                </div>
                <div className="mt-1 text-sm font-bold text-text-primary">
                  {order.contact?.fullName || "—"}
                </div>
                <div className="mt-2 text-sm text-text-muted space-y-1">
                  <div>{order.contact?.phone || "—"}</div>
                  <div className="break-words">{order.contact?.email || "—"}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-border-muted bg-white p-4">
                <div className="text-xs font-semibold text-text-muted">
                  Address
                </div>
                <div className="mt-1 text-sm font-bold text-text-primary">
                  {order.contact?.address ? "Delivery Address" : "—"}
                </div>
                <div className="mt-2 text-sm text-text-muted break-words">
                  {order.contact?.address || "No address provided."}
                </div>
              </div>
            </div>
          </div>

          {/* Items Card */}
          <div className="rounded-2xl border border-border-muted bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-extrabold text-text-primary">
                  Items
                </div>
                <div className="mt-1 text-sm text-text-muted">
                  Price × quantity and line totals.
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-border-muted bg-white p-4 text-sm text-text-muted">
                  No items found in this order.
                </div>
              ) : (
                items.map((it, idx) => {
                  const qty = Number(it?.qty || 0);
                  const price = Number(it?.price || 0);
                  const lineTotal = qty * price;

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border-muted bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-extrabold text-text-primary">
                            {it?.name || "Device"}
                          </div>
                          <div className="mt-1 text-xs text-text-muted">
                            Qty: <span className="font-bold">{qty || "—"}</span>{" "}
                            • Price:{" "}
                            <span className="font-bold">Rs {money(price)}</span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-xs text-text-muted">
                            Line Total
                          </div>
                          <div className="text-sm font-extrabold text-text-primary">
                            Rs {money(lineTotal)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Actions */}
            {canCancel && (
              <div className="mt-5 flex flex-col gap-3 border-t border-border-muted pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-text-muted">
                  You can cancel only while the order is in{" "}
                  <span className="font-bold">created</span> status.
                </div>

                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => setConfirmOpen(true)}
                  className="inline-flex items-center justify-center rounded-xl border border-secondary-violet-muted px-4 py-2 text-sm font-extrabold text-secondary-violet-active hover:bg-secondary-violet-muted/10 disabled:opacity-60"
                >
                  {cancelling ? "Cancelling…" : "Cancel Order"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmOpen}
        title="Cancel order?"
        message="This will cancel the order and you might not be able to undo it. Do you want to continue?"
        confirmText="Yes, cancel"
        cancelText="No, keep it"
        variant="danger"
        loading={cancelling}
        onCancel={() => {
          if (!cancelling) setConfirmOpen(false);
        }}
        onConfirm={doCancel}
      />
    </div>
  );
}
