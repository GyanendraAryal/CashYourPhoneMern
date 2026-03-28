import { useEffect, useMemo, useState } from "react";
import Shell from "../components/Shell";
import Modal from "../components/Modal";
import Field from "../components/Field";
import api from "../lib/api";
import { useAdminStats } from "../context/AdminStatsContext";

const empty = {
  name: "",
  rating: 5,
  message: "",
  avatar: "",
  status: "approved",
  active: true,
  file: null,
};

function Btn({ children, onClick, variant = "default", disabled, type = "button" }) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-primary-blue-active text-white hover:opacity-90"
      : variant === "danger"
      ? "border border-primary-blue-muted bg-primary-blue-muted text-primary-blue-active hover:bg-primary-blue-muted"
      : "border border-border-muted bg-white text-text-primary hover:bg-surface-white-subtle";
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
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

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={[
        "relative inline-flex h-7 w-12 items-center rounded-full border transition-colors",
        checked ? "bg-primary-blue-active border-border-muted" : "bg-surface-white-subtle border-border-muted",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
      aria-pressed={checked}
      aria-label="Toggle active"
    >
      <span
        className={[
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

function StatusPill({ status }) {
  const s = String(status || "pending").toLowerCase();
  const cls =
    s === "approved"
      ? "bg-green-50 text-green-700 ring-1 ring-green-100"
      : s === "rejected"
      ? "bg-red-50 text-red-700 ring-1 ring-red-100"
      : "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-100";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{s}</span>
  );
}

export default function ReviewsPage() {
  const { markByTypeRead, refresh } = useAdminStats();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");

  // per-row active toggle loading
  const [togglingId, setTogglingId] = useState("");

  // delete modal
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const deletingItem = useMemo(
    () => items.find((x) => x._id === deleteId) || null,
    [items, deleteId]
  );

  const load = async (nextStatus = statusFilter) => {
    const qs = nextStatus && nextStatus !== "all" ? `?status=${encodeURIComponent(nextStatus)}` : "";
    const res = await api.get(`/api/admin/reviews${qs}`);
    setItems(res.data?.reviews || []);
  };

  useEffect(() => {
    markByTypeRead("NEW_REVIEW");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(statusFilter).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const startCreate = () => {
    setForm(empty);
    setEditingId("");
    setErr("");
    setOpen(true);
  };

  const startEdit = (it) => {
    setForm({ ...empty, ...it, file: null }); // keep avatar URL for preview
    setEditingId(it._id);
    setErr("");
    setOpen(true);
  };

  const onPickAvatar = (file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setForm((f) => ({ ...f, file, avatar: preview }));
  };

  const clearAvatar = () => {
    setForm((f) => ({ ...f, file: null, avatar: "" }));
  };

  const save = async () => {
    setBusy(true);
    setErr("");

    try {
      if (!form.name?.trim() || !form.message?.trim()) {
        throw new Error("Name and message are required");
      }

      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("rating", String(form.rating ?? 5));
      fd.append("message", form.message.trim());
      fd.append("status", String(form.status || (form.active ? "approved" : "pending")));
      fd.append("active", form.active ? "true" : "false");

      if (form.file) {
        fd.append("avatar", form.file);
      } else if (!form.avatar && editingId) {
        fd.append("avatar", ""); // tell server to clear
      }

      if (editingId) {
        await api.patch(`/api/admin/reviews/${editingId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/api/admin/reviews", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setOpen(false);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (it, nextValue) => {
    // optimistic update
    const prev = items;
    setItems((cur) => cur.map((x) => (x._id === it._id ? { ...x, active: nextValue } : x)));

    setTogglingId(it._id);
    try {
      await api.patch(`/api/admin/reviews/${it._id}`, { active: nextValue });
    } catch (e) {
      setItems(prev);
      alert(e?.response?.data?.message || e.message || "Toggle failed");
    } finally {
      setTogglingId("");
    }
  };

  const askDelete = (id) => setDeleteId(id);

  const doDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/api/admin/reviews/${deleteId}`);
      setDeleteId(null);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Shell>
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-2xl font-extrabold tracking-tight text-text-primary">Reviews</div>
          <div className="mt-1 text-sm text-text-muted">
            Manage customer reviews shown on the client site. Add, edit, toggle visibility, or delete.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-border-muted bg-white px-3 text-sm font-semibold text-text-primary shadow-sm hover:bg-surface-white-subtle"
            aria-label="Filter reviews by status"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>

          <button
          className="inline-flex items-center justify-center rounded-xl bg-primary-blue-active px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-[0.99]"
          onClick={startCreate}
        >
          + New Review
        </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-border-muted bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-surface-white-subtle text-left">
              <tr className="text-text-primary">
                <th className="p-4 w-20">Avatar</th>
                <th className="p-4 w-56">Name</th>
                <th className="p-4 w-24">Rating</th>
                <th className="p-4">Message</th>
                <th className="p-4 w-28">Status</th>
                <th className="p-4 w-28">Active</th>
                <th className="p-4 w-52">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {items.map((it) => (
                <tr key={it._id} className="hover:bg-surface-white-subtle/60">
                  <td className="p-4">
                    {it.avatar ? (
                      <img
                        src={it.avatar}
                        className="h-10 w-10 rounded-full object-cover ring-1 ring-border-muted"
                        alt=""
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-surface-white-subtle ring-1 ring-border-muted" />
                    )}
                  </td>

                  <td className="p-4 font-semibold text-text-primary">{it.name}</td>

                  <td className="p-4 text-text-primary">{it.rating}</td>

                  <td className="p-4 text-text-primary">
                    <div className="line-clamp-2">{it.message}</div>
                  </td>

                  <td className="p-4">
                    <StatusPill status={it.status} />
                  </td>

                  <td className="p-4">
                    <Toggle
                      checked={Boolean(it.active)}
                      disabled={togglingId === it._id}
                      onChange={(val) => toggleActive(it, val)}
                    />
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {String(it.status || "").toLowerCase() !== "approved" ? (
                        <Btn
                          variant="primary"
                          onClick={async () => {
                            try {
                              await api.patch(`/api/admin/reviews/${it._id}`, { status: "approved" });
                              refresh();
                              load(statusFilter);
                            } catch (e) {
                              alert(e?.response?.data?.message || e.message || "Approve failed");
                            }
                          }}
                        >
                          Approve
                        </Btn>
                      ) : null}

                      {String(it.status || "").toLowerCase() !== "rejected" ? (
                        <Btn
                          variant="danger"
                          onClick={async () => {
                            try {
                              await api.patch(`/api/admin/reviews/${it._id}`, { status: "rejected" });
                              refresh();
                              load(statusFilter);
                            } catch (e) {
                              alert(e?.response?.data?.message || e.message || "Reject failed");
                            }
                          }}
                        >
                          Reject
                        </Btn>
                      ) : null}
                      <Btn onClick={() => startEdit(it)}>Edit</Btn>
                      <Btn variant="danger" onClick={() => askDelete(it._id)}>
                        Delete
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}

              {!items.length ? (
                <tr>
                  <td className="p-10 text-center text-text-muted" colSpan="6">
                    <div className="mx-auto max-w-md">
                      <div className="text-base font-semibold text-text-primary">No reviews yet</div>
                      <div className="mt-1 text-sm text-text-muted">
                        Click <span className="font-semibold">“New Review”</span> to add the first one.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={open} title={editingId ? "Edit Review" : "New Review"} onClose={() => setOpen(false)}>
        {err ? (
          <div className="mb-4 rounded-xl border border-primary-blue-muted bg-primary-blue-muted px-4 py-3 text-sm text-primary-blue-active">
            {err}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name">
            <InputShell>
              <input
                className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Customer name"
              />
            </InputShell>
          </Field>

          <Field label="Rating (1-5)">
            <InputShell>
              <input
                type="number"
                min="1"
                max="5"
                className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              />
            </InputShell>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Message">
              <InputShell>
                <textarea
                  className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted min-h-[120px]"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Write the review message..."
                />
              </InputShell>
            </Field>
          </div>

          <Field label="Active">
            <div className="flex items-center gap-3 pt-1">
              <Toggle
                checked={Boolean(form.active)}
                onChange={(val) => setForm({ ...form, active: val })}
              />
              <span className="text-sm text-text-primary">{form.active ? "Active" : "Inactive"}</span>
            </div>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Upload Avatar">
              <input type="file" accept="image/*" onChange={(e) => onPickAvatar(e.target.files?.[0])} />
            </Field>

            <div className="mt-2 flex items-center gap-3">
              {form.avatar ? (
                <img
                  src={form.avatar}
                  className="h-10 w-10 rounded-full object-cover ring-1 ring-border-muted"
                  alt=""
                />
              ) : (
                <div className="text-sm text-text-muted">No avatar</div>
              )}

              {form.avatar ? (
                <Btn variant="default" onClick={clearAvatar}>
                  Remove avatar
                </Btn>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Btn onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={save} disabled={busy}>
            {busy ? "Saving..." : "Save"}
          </Btn>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={Boolean(deleteId)} title="Delete Review" onClose={() => setDeleteId(null)}>
        <p className="text-sm text-text-primary">
          Are you sure you want to delete this review?
          {deletingItem ? (
            <>
              <br />
              <span className="font-semibold text-text-primary">{deletingItem.name}</span>
            </>
          ) : null}
          <br />
          <span className="font-semibold text-primary-blue-active">This action cannot be undone.</span>
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
