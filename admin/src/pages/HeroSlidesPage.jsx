import { useEffect, useMemo, useState } from "react";
import Shell from "../components/Shell";
import Modal from "../components/Modal";
import Field from "../components/Field";
import api from "../lib/api";

const empty = {
  title: "",
  subtitle: "",
  ctaText: "Sell Now",
  ctaLink: "/sell",

  // legacy single image (kept for backward compatibility)
  image: "",

  // responsive images (recommended)
  imageDesktop: "",
  imageMobile: "",

  desktopFile: null,
  mobileFile: null,

  order: 0,
  active: true,
};

function Btn({ children, onClick, variant = "default", disabled, title }) {
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
      title={title}
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

function Pill({ active }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      ].join(" ")}
    >

    </span>
  );
}

export default function HeroSlidesPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // delete confirm modal
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const deletingItem = useMemo(
    () => items.find((x) => x._id === deleteId) || null,
    [items, deleteId]
  );

  const load = async () => {
    const res = await api.get("/api/admin/hero");
    setItems(res.data || []);
  };

  useEffect(() => {
    load().catch(() => { });
  }, []);

  const startCreate = () => {
    setForm(empty);
    setEditingId("");
    setErr("");
    setOpen(true);
  };

  const startEdit = (it) => {
    setForm({
      ...empty,
      ...it,
      active: Boolean(it.active),

      desktopFile: null,
      mobileFile: null,

      // Prefer new fields, fallback to legacy
      imageDesktop: it.imageDesktop || it.image || "",
      imageMobile: it.imageMobile || "",

      // Keep legacy populated for older slides
      image: it.image || it.imageDesktop || "",

      order: Number(it.order || 0),
    });
    setEditingId(it._id);
    setErr("");
    setOpen(true);
  };

  const onPickDesktop = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((f) => ({
      ...f,
      desktopFile: file,
      imageDesktop: url,
      // keep legacy preview synced
      image: url,
    }));
  };

  const onPickMobile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((f) => ({ ...f, mobileFile: file, imageMobile: url }));
  };

  const clearDesktop = () => {
    setForm((f) => ({ ...f, desktopFile: null, imageDesktop: "", image: "" }));
  };

  const clearMobile = () => {
    setForm((f) => ({ ...f, mobileFile: null, imageMobile: "" }));
  };

  const save = async () => {
    setBusy(true);
    setErr("");

    try {
      if (!editingId && !form.desktopFile) throw new Error("Desktop image is required");
      if (editingId && !form.desktopFile && !form.imageDesktop && !form.image) throw new Error("Desktop image is required");

      const fd = new FormData();
      fd.append("title", String(form.title || "").trim());
      fd.append("subtitle", String(form.subtitle || "").trim());
      fd.append("ctaText", String(form.ctaText || "").trim());
      fd.append("ctaLink", String(form.ctaLink || "").trim());
      fd.append("order", String(Number(form.order || 0)));
      fd.append("active", form.active ? "true" : "false");

      if (form.desktopFile) fd.append("imageDesktop", form.desktopFile);
      if (form.mobileFile) fd.append("imageMobile", form.mobileFile);

      if (editingId) {
        await api.patch(`/api/admin/hero/${editingId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/api/admin/hero", fd, {
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

  // toggle active from table (optimistic)
  const toggleActive = async (it, nextValue) => {
    const prev = items;
    setItems((cur) => cur.map((x) => (x._id === it._id ? { ...x, active: nextValue } : x)));

    try {
      await api.patch(`/api/admin/hero/${it._id}`, { active: nextValue });
    } catch (e) {
      setItems(prev);
      alert(e?.response?.data?.message || e.message || "Toggle failed");
    }
  };

  // delete flow
  const askDelete = (id) => setDeleteId(id);

  const doDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/api/admin/hero/${deleteId}`);
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
          <div className="text-2xl font-extrabold tracking-tight text-text-primary">Hero Slides</div>
          <div className="mt-1 text-sm text-text-muted">
            Manage homepage hero slider. Toggle visibility and edit content.
          </div>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-xl bg-primary-blue-active px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-[0.99]"
          onClick={startCreate}
        >
          + New Slide
        </button>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-border-muted bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-surface-white-subtle text-left">
              <tr className="text-text-primary">
                <th className="p-4 w-40">Preview</th>
                <th className="p-4">Title</th>
                <th className="p-4 w-28">Active</th>
                <th className="p-4 w-56">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {items.map((it) => (
                <tr key={it._id} className="hover:bg-surface-white-subtle/60">
                  {/* Preview */}
                  <td className="p-4">
                    {(it.imageDesktop || it.image) ? (
                      <img
                        src={it.imageDesktop || it.image}
                        alt=""
                        className="h-12 w-28 rounded-xl object-cover ring-1 ring-border-muted"
                      />
                    ) : (
                      <div className="h-12 w-28 rounded-xl bg-surface-white-subtle ring-1 ring-border-muted" />
                    )}
                  </td>

                  {/* Title */}
                  <td className="p-4">
                    <div className="font-semibold text-text-primary">
                      {it.title || <span className="italic text-text-muted">No title</span>}
                    </div>
                    <div className="mt-1 text-xs text-text-muted line-clamp-2">
                      {it.subtitle || "-"}
                    </div>
                    <div className="mt-2 text-xs text-text-muted">
                      CTA: <span className="font-semibold text-text-primary">{it.ctaText || "-"}</span> →{" "}
                      <span className="font-mono">{it.ctaLink || "-"}</span>
                    </div>
                  </td>

                  {/* Active */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Toggle checked={Boolean(it.active)} onChange={(v) => toggleActive(it, v)} />
                      <Pill active={Boolean(it.active)} />
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
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
                  <td className="p-10 text-center text-text-muted" colSpan="4">
                    <div className="mx-auto max-w-md">
                      <div className="text-base font-semibold text-text-primary">No hero slides yet</div>
                      <div className="mt-1 text-sm text-text-muted">
                        Click <span className="font-semibold">“New Slide”</span> to add your first slide.
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
      <Modal open={open} title={editingId ? "Edit Slide" : "New Slide"} onClose={() => setOpen(false)}>
        {err ? (
          <div className="mb-4 rounded-xl border border-primary-blue-muted bg-primary-blue-muted px-4 py-3 text-sm text-primary-blue-active">
            {err}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title">
            <InputShell>
              <input
                className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </InputShell>
          </Field>

          <Field label="Order">
            <InputShell>
              <input
                type="number"
                className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              />
            </InputShell>
          </Field>

          <Field label="Subtitle">
            <InputShell>
              <input
                className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </InputShell>
          </Field>

          <Field label="Active">
            <div className="flex items-center gap-3 pt-1">
              <Toggle checked={Boolean(form.active)} onChange={(v) => setForm({ ...form, active: v })} />
              <span className="text-sm text-text-primary">{form.active ? "Active" : "Inactive"}</span>
            </div>
          </Field>

          <Field label="CTA Text">
            <InputShell>
              <input
                className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                value={form.ctaText}
                onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
              />
            </InputShell>
          </Field>

          <Field label="CTA Link">
            <InputShell>
              <input
                className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                value={form.ctaLink}
                onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
              />
            </InputShell>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Desktop Image" hint="Required. Upload JPG, PNG, or WebP.">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPickDesktop(e.target.files?.[0])}
                disabled={busy}
              />
            </Field>

            <div className="mt-3 flex items-center gap-3">
              {form.imageDesktop ? (
                <img
                  src={form.imageDesktop}
                  className="h-24 w-48 object-cover rounded-xl ring-1 ring-border-muted"
                  alt=""
                />
              ) : (
                <div className="text-sm text-text-muted">No desktop image selected</div>
              )}

              {form.imageDesktop ? (
                <Btn onClick={clearDesktop} disabled={busy}>
                  Remove desktop image
                </Btn>
              ) : null}
            </div>

            <div className="mt-5">
              <Field label="Mobile Image" hint="Optional. Recommended for best mobile hero rendering.">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickMobile(e.target.files?.[0])}
                  disabled={busy}
                />
              </Field>

              <div className="mt-3 flex items-center gap-3">
                {form.imageMobile ? (
                  <img
                    src={form.imageMobile}
                    className="h-24 w-48 object-cover rounded-xl ring-1 ring-border-muted"
                    alt=""
                  />
                ) : (
                  <div className="text-sm text-text-muted">No mobile image selected</div>
                )}

                {form.imageMobile ? (
                  <Btn onClick={clearMobile} disabled={busy}>
                    Remove mobile image
                  </Btn>
                ) : null}
              </div>
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
      <Modal open={Boolean(deleteId)} title="Delete Slide" onClose={() => setDeleteId(null)}>
        <p className="text-sm text-text-primary">
          Are you sure you want to delete this slide?
          {deletingItem ? (
            <>
              <br />
              <span className="font-semibold text-text-primary">{deletingItem.title || "Untitled Slide"}</span>
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
