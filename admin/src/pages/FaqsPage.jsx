import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import Modal from "../components/Modal";
import Field from "../components/Field";
import api from "../lib/api";

const empty = {
  question: "",
  answer: "",
  category: "",
  isActive: true,
};

function Btn({ children, onClick, variant = "default", disabled }) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold shadow-sm active:scale-[0.99] disabled:opacity-50";
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

export default function FaqsPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [togglingId, setTogglingId] = useState("");

  // delete confirm modal
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    const res = await api.get("/api/admin/faqs");
    setItems(res.data || []);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const startCreate = () => {
    setForm(empty);
    setEditingId("");
    setErr("");
    setOpen(true);
  };

  const startEdit = (it) => {
    setForm({
      question: it.question || "",
      answer: it.answer || "",
      category: it.category || "",
      isActive: Boolean(it.isActive),
    });
    setEditingId(it._id);
    setErr("");
    setOpen(true);
  };

  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      if (!form.question.trim() || !form.answer.trim()) {
        throw new Error("Question and Answer are required.");
      }

      if (editingId) {
        await api.put(`/api/admin/faqs/${editingId}`, form);
      } else {
        await api.post("/api/admin/faqs", form);
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
    setItems((cur) =>
      cur.map((x) => (x._id === it._id ? { ...x, isActive: nextValue } : x))
    );

    setTogglingId(it._id);
    try {
      await api.put(`/api/admin/faqs/${it._id}`, { isActive: nextValue });
    } catch (e) {
      setItems(prev);
      alert(e?.response?.data?.message || e.message || "Toggle failed");
    } finally {
      setTogglingId("");
    }
  };

  const confirmDelete = (id) => setDeleteId(id);

  const doDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/api/admin/faqs/${deleteId}`);
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
          <div className="text-2xl font-extrabold tracking-tight text-text-primary">
            FAQs
          </div>
          <div className="mt-1 text-sm text-text-muted">
            Manage questions shown on the client site. Toggle visibility or edit
            content.
          </div>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-xl bg-primary-blue-active px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-[0.99]"
          onClick={startCreate}
        >
          + New FAQ
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border-muted bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-surface-white-subtle text-left">
              <tr className="text-text-primary">
                <th className="p-4">Question</th>
                <th className="p-4 w-40">Category</th>
                <th className="p-4 w-28">Active</th>
                <th className="p-4 w-44">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {items.map((it) => (
                <tr key={it._id} className="hover:bg-surface-white-subtle/60">
                  <td className="p-4">
                    <div className="font-semibold text-text-primary line-clamp-2">
                      {it.question}
                    </div>
                    <div className="mt-1 text-xs text-text-muted line-clamp-2">
                      {it.answer}
                    </div>
                  </td>

                  <td className="p-4 text-text-primary">{it.category || "-"}</td>

                  <td className="p-4">
                    <Toggle
                      checked={Boolean(it.isActive)}
                      disabled={togglingId === it._id}
                      onChange={(val) => toggleActive(it, val)}
                    />
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <Btn onClick={() => startEdit(it)}>Edit</Btn>
                      <Btn variant="danger" onClick={() => confirmDelete(it._id)}>
                        Delete
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}

              {!items.length ? (
                <tr>
                  <td className="p-10 text-center text-text-muted" colSpan="4">
                    <div className="mx-auto max-w-md">
                      <div className="text-base font-semibold text-text-primary">
                        No FAQs yet
                      </div>
                      <div className="mt-1 text-sm text-text-muted">
                        Click{" "}
                        <span className="font-semibold">“New FAQ”</span> to add
                        your first question.
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
      <Modal
        open={open}
        title={editingId ? "Edit FAQ" : "New FAQ"}
        onClose={() => setOpen(false)}
      >
        {err ? (
          <div className="mb-4 rounded-xl border border-primary-blue-muted bg-primary-blue-muted px-4 py-3 text-sm text-primary-blue-active">
            {err}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4">
          <Field label="Question">
            <InputShell>
              <input
                className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="Type the FAQ question..."
              />
            </InputShell>
          </Field>

          <Field label="Answer">
            <InputShell>
              <textarea
                rows={6}
                className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                placeholder="Write the answer..."
              />
            </InputShell>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Category (optional)">
              <InputShell>
                <input
                  className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g., Payments / Delivery"
                />
              </InputShell>
            </Field>

            <Field label="Active">
              <div className="flex items-center gap-3 pt-1">
                <Toggle
                  checked={Boolean(form.isActive)}
                  onChange={(val) => setForm({ ...form, isActive: val })}
                />
                <span className="text-sm text-text-primary">
                  {form.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </Field>
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

      {/* Delete Confirm Modal (SEPARATE) */}
      <Modal
        open={Boolean(deleteId)}
        title="Delete FAQ"
        onClose={() => setDeleteId(null)}
      >
        <p className="text-sm text-text-primary">
          Are you sure you want to delete this FAQ?
          <br />
          <span className="font-semibold text-primary-blue-active">
            This action cannot be undone.
          </span>
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Btn onClick={() => setDeleteId(null)} disabled={deleteLoading}>
            Cancel
          </Btn>

          <Btn variant="danger" disabled={deleteLoading} onClick={doDelete}>
            {deleteLoading ? "Deleting..." : "Delete"}
          </Btn>
        </div>
      </Modal>
    </Shell>
  );
}
