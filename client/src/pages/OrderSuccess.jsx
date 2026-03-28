import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getOrder } from "../services/orderService";

function StatusPill({ status }) {
  const s = String(status || "created").toLowerCase();

  const map = {
    created: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    pending: "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-100",
    paid: "bg-green-50 text-green-700 ring-1 ring-green-100",
    shipped: "bg-purple-50 text-purple-700 ring-1 ring-purple-100",
    delivered: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    cancelled: "bg-red-50 text-red-700 ring-1 ring-red-100",
  };

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        map[s] || "bg-gray-50 text-gray-700 ring-1 ring-gray-100",
      ].join(" ")}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status || "created"}
    </span>
  );
}

function formatMoney(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("en-IN");
}

export default function OrderSuccess() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setErr("No order ID provided");
      return;
    }

    const abortController = new AbortController();

    async function loadOrder() {
      try {
        setLoading(true);
        setErr("");
        const orderDoc = await getOrder(id, { signal: abortController.signal });
        if (!abortController.signal.aborted) {
          setOrder(orderDoc || null);
        }
      } catch (e) {
        if (e.name !== "AbortError" && !abortController.signal.aborted) {
          const msg = e?.message || e?.response?.data?.message || "Failed to load order.";
          setErr(msg);
          toast.error(msg);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      abortController.abort();
    };
  }, [id]);

  const orderNumber = order?.orderNumber || order?._id || id;
  const items = order?.items || [];
  
  const itemsCount = useMemo(() => 
    items.reduce((sum, it) => sum + Number(it.qty || 0), 0), 
    [items]
  );

  const handleRetry = useCallback(() => {
    setErr("");
    // Trigger re-fetch by resetting id dependency
    window.location.reload();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-gradient-to-b from-blue-50/60 via-white to-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-3 w-72 bg-gray-200 rounded" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="h-20 bg-gray-200 rounded-xl" />
                <div className="h-20 bg-gray-200 rounded-xl" />
                <div className="h-20 bg-gray-200 rounded-xl" />
              </div>
              <div className="h-44 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-blue-50/60 via-white to-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-green-100 text-green-700 grid place-items-center shadow-sm ring-1 ring-green-200">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              Order placed successfully
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-600 max-w-2xl">
              Your order has been created. Payments are disabled for now, so your order will remain unpaid.
            </p>
          </div>

          {/* Action row (top quick actions) */}
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            <Link
              to="/my-orders"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 active:scale-[0.99] transition"
            >
              View My Orders
            </Link>
            <Link
              to={`/my-orders/${order?._id || id}`}
              className="inline-flex items-center justify-center rounded-xl bg-primary-blue-active px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95 active:scale-[0.99] transition"
            >
              View Details
            </Link>
          </div>
        </div>

        {/* Content */}
        {err ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <div className="font-semibold">Couldn’t load order</div>
            <div className="text-sm mt-1">{err}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link 
                className="rounded-xl bg-white border border-red-200 px-4 py-2 text-sm font-medium hover:bg-red-100 transition" 
                to="/my-orders"
              >
                Go to My Orders
              </Link>
              <button
                onClick={handleRetry}
                className="rounded-xl bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : !order ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-700 shadow-sm">
            Order not found.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Summary */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Order</div>
                    <div className="text-lg font-semibold text-gray-900 break-all">
                      #{orderNumber}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500">Status</div>
                    <StatusPill status={order.status || "created"} />
                  </div>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="mt-1 text-base font-semibold text-gray-900">
                      Rs {formatMoney(order.total)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">Items</div>
                    <div className="mt-1 text-base font-semibold text-gray-900">
                      {itemsCount}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">Contact</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900 truncate">
                      {order.contact?.fullName || "—"}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {order.contact?.phone || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-gray-900">Items</div>
                    <div className="text-xs text-gray-500">
                      {items.length} item{items.length === 1 ? "" : "s"}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {items.map((it, idx) => {
                      const qty = Number(it.qty || 0);
                      const price = Number(it.price || 0);
                      const line = qty * price;

                      return (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 p-4 hover:bg-gray-50 transition"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate">
                              {it.name || "Device"}
                            </div>
                            <div className="mt-1 text-xs text-gray-600">
                              Qty: <span className="font-medium text-gray-800">{qty || 1}</span>{" "}
                              • Price: <span className="font-medium text-gray-800">Rs {formatMoney(price)}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs text-gray-500">Subtotal</div>
                            <div className="font-semibold text-gray-900">
                              Rs {formatMoney(line)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
