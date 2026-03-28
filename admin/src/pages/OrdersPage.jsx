import { useEffect, useMemo, useState } from "react";
import Shell from "../components/Shell";
import { useAdminStats } from "../context/AdminStatsContext";
import { getOrders, updateOrderStatus } from "../services/orderService";
import ConfirmModal from "../components/ConfirmModal"; // ✅ add

export default function OrdersPage() {
  const { markByTypeRead } = useAdminStats();

  useEffect(() => {
    markByTypeRead("NEW_ORDER");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ✅ confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  // pendingAction = { id, status, label }

  const params = useMemo(() => {
    const p = {};
    p.page = page;
    p.limit = 20;
    if (statusFilter && statusFilter !== "all") p.status = statusFilter;
    return p;
  }, [statusFilter, page]);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");

      const res = await getOrders(params);
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.orders)
          ? res.data.orders
          : [];

      setOrders(list);
      const pPages = Number(res.data?.pages);
      if (Number.isFinite(pPages) && pPages > 0) setPages(pPages);
      else setPages(1);
    } catch (e) {
      console.error("getOrders failed:", e);
      setErr(e?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  const changeStatus = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      setOrders((o) => o.map((ord) => (ord._id === id ? { ...ord, status } : ord)));
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update order");
      throw e;
    }
  };

  // ✅ open modal for action
  const requestStatusChange = (id, status, label) => {
    setPendingAction({ id, status, label });
    setConfirmOpen(true);
  };

  // ✅ confirm handler
  const onConfirm = async () => {
    if (!pendingAction) return;
    try {
      setConfirmLoading(true);
      await changeStatus(pendingAction.id, pendingAction.status);
      setConfirmOpen(false);
      setPendingAction(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  const onCancel = () => {
    if (confirmLoading) return; // optional: prevent closing while saving
    setConfirmOpen(false);
    setPendingAction(null);
  };

  const isCancel = pendingAction?.status === "cancelled";

  return (
    <Shell>
      <div className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold">Orders</h1>

          <div className="flex items-center gap-2">
            <label className="text-sm text-text-muted">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="created">Created</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button className="border px-3 py-1 rounded text-sm" onClick={load}>
              Refresh
            </button>
          </div>
        </div>

        {loading && <div className="text-sm text-text-muted">Loading…</div>}
        {err && <div className="text-sm text-primary-blue-active">{err}</div>}

        {!loading && !err && orders.length === 0 && (
          <div className="text-sm text-text-muted">No orders found.</div>
        )}

        {!loading && !err && orders.length > 0 && (
          <div className="rounded-xl border overflow-x-auto bg-white">
            <table className="min-w-[880px] w-full text-sm">
              <thead className="bg-surface-white-subtle">
                <tr className="text-left">
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{o.orderNumber || o._id}</div>
                      <div className="text-text-muted">{o.paymentStatus || "unpaid"}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{o.user?.email || o.contact?.email || "N/A"}</div>
                      <div className="text-text-muted">
                        {o.contact?.fullName || ""} {o.contact?.phone ? `• ${o.contact.phone}` : ""}
                      </div>
                    </td>
                    <td className="p-3">{o.status || "created"}</td>
                    <td className="p-3">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : "N/A"}
                    </td>
                    <td className="p-3">Rs {o.total ?? 0}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="border px-2 py-1 rounded"
                          onClick={() => requestStatusChange(o._id, "processing", "Accept")}
                        >
                          Accept
                        </button>
                        <button
                          className="border px-2 py-1 rounded"
                          onClick={() => requestStatusChange(o._id, "shipped", "Ship")}
                        >
                          Ship
                        </button>
                        <button
                          className="border px-2 py-1 rounded"
                          onClick={() => requestStatusChange(o._id, "completed", "Complete")}
                        >
                          Complete
                        </button>
                        <button
                          className="border px-2 py-1 rounded"
                          onClick={() => requestStatusChange(o._id, "cancelled", "Cancel")}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !err && pages > 1 && (
          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              className="border px-3 py-1 rounded text-sm disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <div className="text-sm text-text-muted">
              Page {page} / {pages}
            </div>
            <button
              className="border px-3 py-1 rounded text-sm disabled:opacity-50"
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ✅ Confirm Modal */}
      <ConfirmModal
        open={confirmOpen}
        title={isCancel ? "Cancel order?" : "Update order status?"}
        message={
          pendingAction
            ? `Are you sure you want to ${pendingAction.label?.toLowerCase()} this order?`
            : "Are you sure?"
        }
        confirmText={pendingAction?.label || "Confirm"}
        cancelText="No, go back"
        variant={isCancel ? "danger" : "primary"}
        loading={confirmLoading}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </Shell>
  );
}
