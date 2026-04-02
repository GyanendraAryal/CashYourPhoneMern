import { useEffect, useMemo, useState } from "react";
import Shell from "../components/Shell";
import Modal from "../components/Modal";
import api from "../lib/api";
import PaymentVerification from "../components/payments/PaymentVerification";
import toast from "react-hot-toast";

const statusStyles = {
  initiated: "bg-primary-blue-muted text-primary-blue-active ring-1 ring-primary-blue-muted",
  succeeded: "bg-success-green-muted text-success-green-dark ring-1 ring-success-green-muted",
  failed: "bg-primary-blue-muted text-primary-blue-active ring-1 ring-primary-blue-muted",
};

const Badge = ({ status }) => (
  <span
    className={
      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold " +
      (statusStyles[status] || "bg-surface-white-subtle text-text-primary ring-1 ring-border-muted")
    }
  >
    {status}
  </span>
);

function Btn({ children, onClick, variant = "default", disabled, type = "button" }) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    default: "bg-primary-blue-active text-white hover:bg-primary-blue-active",
    ghost: "bg-transparent text-text-primary hover:bg-surface-white-subtle shadow-none",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base + " " + styles[variant]}>
      {children}
    </button>
  );
}

export default function PaymentsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [status, setStatus] = useState("");
  const [provider, setProvider] = useState("");
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [order, setOrder] = useState(null);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const load = async () => {
    const res = await api.get("/api/admin/payments", {
      params: {
        page,
        limit,
        status: status || undefined,
        provider: provider || undefined,
        q: q || undefined,
      },
    });
    setItems(res.data?.items || []);
    setTotal(res.data?.total || 0);
  };

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, provider]);

  const onSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    await load();
  };

  const openRow = async (id) => {
    setErr("");
    setBusy(true);
    try {
      const res = await api.get(`/api/admin/payments/${id}`);
      setActive(res.data?.payment || null);
      setOrder(res.data?.order || null);
      setOpen(true);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load payment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold">Payments</h1>
            <p className="text-sm text-text-muted">Track provider payments and webhook status.</p>
          </div>

          <form onSubmit={onSearch} className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-border-muted bg-white px-3 text-sm"
            >
              <option value="">All providers</option>
                            <option value="khalti">khalti</option>
              <option value="esewa">esewa</option>
              <option value="bank">bank</option>
            </select>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-border-muted bg-white px-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="initiated">initiated</option>
                            <option value="succeeded">succeeded</option>
              <option value="failed">failed</option>
                          </select>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search intent/ref..."
              className="h-10 w-full rounded-xl border border-border-muted bg-white px-3 text-sm sm:w-72"
            />

            <Btn type="submit" disabled={busy}>Search</Btn>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border-muted bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-white-subtle text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((p) => (
                  <tr key={p._id} className="hover:bg-surface-white-subtle">
                    <td className="px-4 py-3 font-semibold">{p.provider}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.orderNumber || (p.orderId ? String(p.orderId).slice(-6) : "-")}</div>
                      <div className="text-xs text-text-muted">{p.intentId || "-"}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{p.amount} {p.currency || "NPR"}</td>
                    <td className="px-4 py-3"><Badge status={p.status} /></td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {p.createdAt ? new Date(p.createdAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Btn variant="ghost" onClick={() => openRow(p._id)} disabled={busy}>
                        View
                      </Btn>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td className="px-4 py-10 text-center text-text-muted" colSpan={6}>
                      No payments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border-muted px-4 py-3">
            <div className="text-xs text-text-muted">
              Page {page} / {pages} • {total} total
            </div>
            <div className="flex gap-2">
              <Btn variant="ghost" disabled={page <= 1 || busy} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Prev
              </Btn>
              <Btn variant="ghost" disabled={page >= pages || busy} onClick={() => setPage((p) => Math.min(pages, p + 1))}>
                Next
              </Btn>
            </div>
          </div>
        </div>

        <Modal open={open} onClose={() => setOpen(false)} title="Payment details">
          {err && (
            <div className="mb-3 rounded-xl bg-primary-blue-muted px-3 py-2 text-sm text-primary-blue-active ring-1 ring-primary-blue-muted">
              {err}
            </div>
          )}

          {!active ? (
            <div className="text-sm text-text-muted">No payment selected.</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border-muted bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-text-muted">Provider</div>
                    <div className="text-lg font-bold">{active.provider}</div>
                  </div>
                  <Badge status={active.status} />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold text-text-muted">Amount</div>
                    <div className="text-sm font-semibold">{active.amount} {active.currency || "NPR"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-muted">Refs</div>
                    <div className="text-sm">intent: {active.intentId || "-"}</div>
                    <div className="text-sm">ref: {active.referenceId || "-"}</div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-text-muted">
                  webhook verified: {String(active.webhookVerified)}
                </div>
              </div>

              {order && (
                <div className="rounded-2xl border border-border-muted bg-white p-4">
                  <div className="mb-2 text-sm font-bold">Order</div>
                  <div className="text-sm">Order: {order.orderNumber || order._id}</div>
                  <div className="text-sm">Status: {order.status}</div>
                  <div className="text-sm">Total: {order.total} {order.currency || "NPR"}</div>
                </div>
              )}

              {active.provider === "esewa" && active.status !== "succeeded" && (
                <PaymentVerification 
                  paymentId={active._id} 
                  onVerified={(updated) => {
                    setActive(updated);
                    setItems(items.map(it => it._id === updated._id ? updated : it));
                  }}
                />
              )}
            </div>
          )}
        </Modal>
      </div>
    </Shell>
  );
}
