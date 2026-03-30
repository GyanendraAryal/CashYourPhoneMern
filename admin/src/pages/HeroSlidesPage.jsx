import { useEffect, useMemo, useState } from "react";
import Shell from "../components/Shell";
import Modal from "../components/Modal";
import Field from "../components/Field";
import api from "../lib/api";
import AppImage from "../components/ui/AppImage";

const empty = {
  title: "",
  subtitle: "",
  ctaText: "Sell Now",
  ctaLink: "/sell",

  image: "",
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
        checked
          ? "bg-primary-blue-active border-border-muted"
          : "bg-surface-white-subtle border-border-muted",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
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
    <span className="text-xs font-semibold text-text-muted">
      {active ? "Active" : "Inactive"}
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

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const deletingItem = useMemo(
    () => items.find((x) => x._id === deleteId) || null,
    [items, deleteId]
  );

  /* ✅ FIXED LOAD */
  const load = async () => {
    try {
      const res = await api.get("/api/admin/hero");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setItems([]);
    }
  };

  useEffect(() => {
    load();
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

      imageDesktop: it.imageDesktop || it.imageUrl || it.image || "",
      imageMobile: it.imageMobile || "",
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
      image: url,
    }));
  };

  const onPickMobile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);

    setForm((f) => ({
      ...f,
      mobileFile: file,
      imageMobile: url,
    }));
  };

  const clearDesktop = () => {
    setForm((f) => ({
      ...f,
      desktopFile: null,
      imageDesktop: "",
      image: "",
    }));
  };

  const clearMobile = () => {
    setForm((f) => ({
      ...f,
      mobileFile: null,
      imageMobile: "",
    }));
  };

  const save = async () => {
    setBusy(true);
    setErr("");

    try {
      if (!editingId && !form.desktopFile)
        throw new Error("Desktop image is required");

      const fd = new FormData();

      fd.append("title", form.title || "");
      fd.append("subtitle", form.subtitle || "");
      fd.append("ctaText", form.ctaText || "");
      fd.append("ctaLink", form.ctaLink || "");
      fd.append("order", String(form.order || 0));
      fd.append("active", form.active ? "true" : "false");

      if (form.desktopFile) fd.append("imageDesktop", form.desktopFile);
      if (form.mobileFile) fd.append("imageMobile", form.mobileFile);

      if (editingId) {
        await api.patch(`/api/admin/hero/${editingId}`, fd);
      } else {
        await api.post("/api/admin/hero", fd);
      }

      setOpen(false);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (it, nextValue) => {
    const prev = items;

    setItems((cur) =>
      cur.map((x) =>
        x._id === it._id ? { ...x, active: nextValue } : x
      )
    );

    try {
      await api.patch(`/api/admin/hero/${it._id}`, {
        active: nextValue,
      });
    } catch (e) {
      setItems(prev);
    }
  };

  const askDelete = (id) => setDeleteId(id);

  const doDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleteLoading(true);
      await api.delete(`/api/admin/hero/${deleteId}`);
      setDeleteId(null);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Shell>
      <div className="mb-5 flex justify-between">
        <div className="text-2xl font-bold">Hero Slides</div>

        <button
          className="bg-primary-blue-active text-white px-4 py-2 rounded-xl"
          onClick={startCreate}
        >
          + New Slide
        </button>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">Preview</th>
              <th className="p-4">Title</th>
              <th className="p-4">Active</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td className="p-4">
                  {(it.imageDesktop || it.imageUrl || it.image) ? (
                    <AppImage
                      src={it.imageDesktop || it.imageUrl || it.image}
                      alt="preview"
                      className="h-12 w-28 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="h-12 w-28 bg-gray-200 rounded-xl" />
                  )}
                </td>

                <td className="p-4">{it.title}</td>

                <td className="p-4">
                  <Toggle
                    checked={it.active}
                    onChange={(v) => toggleActive(it, v)}
                  />
                </td>

                <td className="p-4 flex gap-2">
                  <Btn onClick={() => startEdit(it)}>Edit</Btn>
                  <Btn variant="danger" onClick={() => askDelete(it._id)}>
                    Delete
                  </Btn>
                </td>
              </tr>
            ))}          </tbody>
        </table>
      </div>

      {/* New/Edit Modal */}
      <Modal
        open={open}
        title={editingId ? "Edit Slide" : "New Slide"}
        onClose={() => setOpen(false)}
      >
        {err && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
            {err}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Title">
            <InputShell>
              <input
                className="w-full border rounded-xl p-2 outline-none focus:ring-2 focus:ring-primary-blue-active/20"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </InputShell>
          </Field>

          <Field label="Subtitle">
            <InputShell>
              <input
                className="w-full border rounded-xl p-2 outline-none focus:ring-2 focus:ring-primary-blue-active/20"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </InputShell>
          </Field>

          <Field label="CTA Text">
            <InputShell>
              <input
                className="w-full border rounded-xl p-2 outline-none focus:ring-2 focus:ring-primary-blue-active/20"
                value={form.ctaText}
                onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
              />
            </InputShell>
          </Field>

          <Field label="CTA Link">
            <InputShell>
              <input
                className="w-full border rounded-xl p-2 outline-none focus:ring-2 focus:ring-primary-blue-active/20"
                value={form.ctaLink}
                onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
              />
            </InputShell>
          </Field>

          <Field label="Order">
            <InputShell>
              <input
                type="number"
                className="w-full border rounded-xl p-2 outline-none focus:ring-2 focus:ring-primary-blue-active/20"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
              />
            </InputShell>
          </Field>

          <Field label="Active">
            <div className="flex items-center gap-2 pt-2">
              <Toggle
                checked={form.active}
                onChange={(v) => setForm({ ...form, active: v })}
              />
              <span className="text-sm font-semibold">{form.active ? "Enabled" : "Disabled"}</span>
            </div>
          </Field>

          <div className="md:col-span-2 border-t pt-4 mt-2">
            <h4 className="text-sm font-bold mb-3">Slide Images</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Desktop Image */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Desktop Image (Required)</label>
                {form.imageDesktop ? (
                  <div className="relative group">
                    <img src={form.imageDesktop} className="w-full h-32 object-cover rounded-xl border" alt="desktop" />
                    <button
                      type="button"
                      onClick={clearDesktop}
                      className="absolute top-2 right-2 bg-white/90 p-1 rounded-full shadow-sm hover:bg-white text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="h-32 border-2 border-dashed rounded-xl flex items-center justify-center p-4">
                    <input
                      type="file"
                      onChange={(e) => onPickDesktop(e.target.files?.[0])}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Mobile Image */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Mobile Image (Optional)</label>
                {form.imageMobile ? (
                  <div className="relative group">
                    <img src={form.imageMobile} className="w-full h-32 object-cover rounded-xl border" alt="mobile" />
                    <button
                      type="button"
                      onClick={clearMobile}
                      className="absolute top-2 right-2 bg-white/90 p-1 rounded-full shadow-sm hover:bg-white text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="h-32 border-2 border-dashed rounded-xl flex items-center justify-center p-4">
                    <input
                      type="file"
                      onChange={(e) => onPickMobile(e.target.files?.[0])}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-2">
          <Btn onClick={() => setOpen(false)} disabled={busy}>Cancel</Btn>
          <Btn variant="primary" onClick={save} disabled={busy}>
            {busy ? "Saving..." : "Save Slide"}
          </Btn>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteId} title="Confirm Delete" onClose={() => setDeleteId(null)}>
        <p className="text-sm">Are you sure you want to delete this hero slide?</p>
        <div className="mt-8 flex justify-end gap-2">
          <Btn onClick={() => setDeleteId(null)}>Cancel</Btn>
          <Btn variant="danger" onClick={doDelete} disabled={deleteLoading}>
            {deleteLoading ? "Deleting..." : "Delete Slide"}
          </Btn>
        </div>
      </Modal>
    </Shell>
  );
}