import { useEffect, useMemo, useState } from "react";
import Shell from "../components/Shell";
import { useAdminStats } from "../context/AdminStatsContext";
import Modal from "../components/Modal";
import api from "../lib/api";

const badgeClass = (s) => {
  const map = {
    new: "bg-primary-blue-muted text-primary-blue-active ring-1 ring-primary-blue-muted",
    contacted: "bg-primary-blue-muted text-primary-blue-active ring-1 ring-primary-blue-muted",
    closed: "bg-success-green-muted text-success-green-dark ring-1 ring-success-green-muted",
  };
  return map[s] || "bg-surface-white-subtle text-text-primary ring-1 ring-border-muted";
};

const Badge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(
      status
    )}`}
  >
    {status}
  </span>
);

const stripStorage = (name = "") =>
  String(name)
    .replace(/\b\d+\s?(GB|TB)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const formatCondition = (value = "") =>
  value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());


function Btn({ children, onClick, variant = "default", disabled }) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-primary-blue-active text-white hover:opacity-90"
      : variant === "danger"
        ? "border border-primary-blue-muted bg-primary-blue-muted text-primary-blue-active hover:bg-primary-blue-muted"
        : "border border-border-muted bg-white text-text-primary hover:bg-surface-white-subtle";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles}`}
    >
      {children}
    </button>
  );
}

function InputShell({ children }) {
  return (
    <div className="rounded-2xl transition-shadow duration-200 focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.08)]">
      {children}
    </div>
  );
}

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition",
        active
          ? "bg-primary-blue-active text-white ring-border-muted"
          : "bg-white text-text-primary ring-border-muted hover:bg-surface-white-subtle",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function SellRequestsPage() {
  const { markByTypeRead } = useAdminStats();

  useEffect(() => {
    markByTypeRead("NEW_SELL_REQUEST");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // per-row status update loading
  const [statusBusyId, setStatusBusyId] = useState("");

  // delete confirm modal
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const deletingItem = useMemo(
    () => items.find((x) => x._id === deleteId) || null,
    [items, deleteId]
  );

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/sell-requests", {
        params: status ? { status } : {},
      });

      setItems(res.data.items || res.data || []);
      setErr("");
    } catch (error) {
      console.error("❌ Error loading sell requests:", error);
      setErr(error.response?.data?.message || "Failed to load data");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;

    return items.filter((it) => {
      const a = (it.fullName || "").toLowerCase();
      const b = (it.phone || "").toLowerCase();
      const c = (it.email || "").toLowerCase();
      const d = (it.deviceName || "").toLowerCase();
      const e = (it.deviceCondition || "").toLowerCase();
      return [a, b, c, d, e].some((x) => x.includes(query));
    });
  }, [items, q]);

  const counts = useMemo(() => {
    const base = { all: items.length, new: 0, contacted: 0, closed: 0 };
    for (const it of items) {
      if (it?.status && base[it.status] !== undefined) base[it.status] += 1;
    }
    return base;
  }, [items]);

  const setItemStatus = async (id, next) => {
    try {
      setStatusBusyId(id);
      await api.patch(`/api/admin/sell-requests/${id}/status`, { status: next });
      await load();
    } catch (error) {
      console.error("❌ Status update failed:", error);
      alert(error.response?.data?.message || "Failed to update status");
    } finally {
      setStatusBusyId("");
    }
  };

  const askDelete = (id) => setDeleteId(id);

  const doDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/api/admin/sell-requests/${deleteId}`);
      setDeleteId(null);
      await load();
    } catch (error) {
      alert(error.response?.data?.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Shell>
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-2xl font-extrabold tracking-tight text-text-primary">
            Sell Requests
          </div>
          <div className="mt-1 text-sm text-text-muted">
            Manage sell requests. Filter, update status, search customers/devices,
            or delete entries.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <InputShell>
            <input
              className="w-full sm:w-[280px] rounded-2xl border border-border-muted bg-white px-4 py-2.5 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
              placeholder="Search name, phone, email, device..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </InputShell>

          <Btn onClick={load} disabled={loading} variant="default">
            {loading ? "Refreshing..." : "Refresh"}
          </Btn>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Chip active={status === ""} onClick={() => setStatus("")}>
          All <span className="ml-2 text-[11px] opacity-70">({counts.all})</span>
        </Chip>
        <Chip active={status === "new"} onClick={() => setStatus("new")}>
          New <span className="ml-2 text-[11px] opacity-70">({counts.new})</span>
        </Chip>
        <Chip
          active={status === "contacted"}
          onClick={() => setStatus("contacted")}
        >
          Contacted{" "}
          <span className="ml-2 text-[11px] opacity-70">
            ({counts.contacted})
          </span>
        </Chip>
        <Chip active={status === "closed"} onClick={() => setStatus("closed")}>
          Closed{" "}
          <span className="ml-2 text-[11px] opacity-70">({counts.closed})</span>
        </Chip>

        <div className="ml-auto text-sm text-text-muted">
          Showing{" "}
          <span className="font-semibold text-text-primary">{filtered.length}</span>
          {q.trim() ? " (filtered)" : ""} / {items.length}
        </div>
      </div>

      {err ? (
        <div className="mb-4 rounded-xl border border-primary-blue-muted bg-primary-blue-muted px-4 py-3 text-sm text-primary-blue-active">
          {err}
        </div>
      ) : null}

      {/* Table Card */}
      <div className="rounded-2xl border border-border-muted bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-surface-white-subtle text-left">
              <tr className="text-text-primary">
                <th className="p-4">Customer</th>
                <th className="p-4">Device</th>
                <th className="p-4 w-36">Expected Price</th>
                <th className="p-4 w-40">Intelligence</th>
                <th className="p-4 w-32">Status</th>
                <th className="p-4 w-56">Created</th>
                <th className="p-4 w-[340px]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td className="p-10 text-center text-text-muted" colSpan="7">
                    Loading...
                  </td>
                </tr>
              ) : null}

              {!loading &&
                filtered.map((it) => (
                  <tr key={it._id} className="hover:bg-surface-white-subtle/60">
                    {/* Customer */}
                    <td className="p-4">
                      <div className="font-semibold text-text-primary">
                        {it.fullName || "-"}
                      </div>
                      <div className="mt-0.5 text-xs text-text-muted">
                        {it.phone || "-"} • {it.email || "-"}
                      </div>
                    </td>

                    {/* Device (name without storage + condition) */}
                    <td className="p-4">
                      <div className="font-semibold text-text-primary">
                        {stripStorage(it.deviceName) || "-"}
                      </div>
                      <div className="mt-0.5 text-xs text-text-muted">
                        {it.deviceCondition ? formatCondition(it.deviceCondition) : "-"}
                      </div>

                    </td>

                    {/* Price */}
                    <td className="p-4">
                      <div className="font-bold text-text-primary">
                        NPR {it.expectedPrice?.toLocaleString() ?? "0"}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider font-bold">User Expected</div>
                    </td>

                    {/* AI Intelligence */}
                    <td className="p-4">
                      {it.suggestedPrice > 0 ? (
                        <div>
                          <div className="flex items-center gap-1.5 font-black text-purple-600">
                             NPR {it.suggestedPrice.toLocaleString()}
                             {it.mlConfidence > 0 && <span className="bg-purple-50 text-[9px] px-1 rounded ring-1 ring-purple-100">AI</span>}
                          </div>
                          {it.mlPrice > 0 && it.mlPrice !== it.suggestedPrice && (
                             <div className="text-[10px] text-text-muted">ML Raw: NPR {it.mlPrice.toLocaleString()}</div>
                          )}
                           <div className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider font-bold">Suggested</div>
                        </div>
                      ) : (
                        <span className="text-text-muted italic text-xs">No guidance</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <Badge status={it.status} />
                    </td>

                    {/* Created */}
                    <td className="p-4 text-text-primary">
                      {it.createdAt
                        ? new Date(it.createdAt).toLocaleString()
                        : "-"}
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {["new", "contacted", "closed"].map((s) => (
                          <button
                            key={s}
                            disabled={statusBusyId === it._id}
                            className={[
                              "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold shadow-sm border active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed",
                              it.status === s
                                ? "bg-primary-blue-active text-white border-border-muted"
                                : "bg-white text-text-primary border-border-muted hover:bg-surface-white-subtle",
                            ].join(" ")}
                            onClick={() => setItemStatus(it._id, s)}
                            title={`Mark as ${s}`}
                          >
                            {s}
                          </button>
                        ))}

                        <Btn
                          variant="danger"
                          onClick={() => askDelete(it._id)}
                          disabled={statusBusyId === it._id}
                        >
                          Delete
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && !filtered.length ? (
                <tr>
                  <td className="p-10 text-center text-text-muted" colSpan="7">
                    <div className="mx-auto max-w-md">
                      <div className="text-base font-semibold text-text-primary">
                        No sell requests found
                      </div>
                      <div className="mt-1 text-sm text-text-muted">
                        Try changing the filter or clearing the search.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <Modal
        open={Boolean(deleteId)}
        title="Delete Sell Request"
        onClose={() => setDeleteId(null)}
      >
        <p className="text-sm text-text-primary">
          Are you sure you want to delete this sell request?
          {deletingItem ? (
            <>
              <br />
              <span className="font-semibold text-text-primary">
                {deletingItem.fullName || "Customer"} —{" "}
                {stripStorage(deletingItem.deviceName)}{" "}
                {deletingItem.deviceCondition
                  ? `(${formatCondition(deletingItem.deviceCondition)})`
                  : ""}

              </span>
            </>
          ) : null}
          <br />
          <span className="font-semibold text-primary-blue-active">
            This action cannot be undone.
          </span>
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Btn onClick={() => setDeleteId(null)} disabled={deleteLoading}>
            Cancel
          </Btn>
          <Btn variant="danger" onClick={doDelete} disabled={deleteLoading}>
            {deleteLoading ? "Deleting..." : "Delete"}
          </Btn>
        </div>
      </Modal>
    </Shell>
  );
}
