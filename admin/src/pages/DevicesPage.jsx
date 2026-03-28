import { useEffect, useMemo, useState } from "react";
import Shell from "../components/Shell";
import Modal from "../components/Modal";
import Field from "../components/Field";
import api from "../lib/api";
import { uploadSingle } from "../lib/upload";

const ALLOWED_CONDITIONS = ["new", "like_new", "pre_owned", "refurbished"];
const ALLOWED_AVAILABILITY = ["in_stock", "coming_soon", "out_of_stock"]; // cycle order

const normalizeEnum = (v = "") =>
  String(v).toLowerCase().trim().replace(/\s|-/g, "_");

const safeEnum = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback);

const formatEnumLabel = (value = "") =>
  String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatNpr = (n) => {
  const num = Number(n || 0);
  return `NPR ${num.toLocaleString()}`;
};

const availabilityClass = (s) => {
  const map = {
    in_stock: "bg-success-green-muted text-success-green-dark ring-1 ring-success-green-muted",
    coming_soon: "bg-primary-blue-muted text-primary-blue-active ring-1 ring-primary-blue-muted",
    out_of_stock: "bg-primary-blue-muted text-primary-blue-active ring-1 ring-primary-blue-muted",
  };
  return map[s] || "bg-surface-white-subtle text-text-primary ring-1 ring-border-muted";
};

const conditionClass = (s) => {
  const map = {
    new: "bg-primary-blue-muted text-primary-blue-active ring-1 ring-primary-blue-muted",
    like_new: "bg-success-green-muted text-success-green-dark ring-1 ring-success-green-muted",
    refurbished: "bg-primary-blue-muted text-primary-blue-active ring-1 ring-primary-blue-muted",
    pre_owned: "bg-surface-white-subtle text-text-primary ring-1 ring-border-muted",
  };
  return map[s] || "bg-surface-white-subtle text-text-primary ring-1 ring-border-muted";
};

const Pill = ({ kind = "neutral", text }) => {
  const cls =
    kind === "availability"
      ? availabilityClass(text)
      : kind === "condition"
      ? conditionClass(text)
      : "bg-surface-white-subtle text-text-primary ring-1 ring-border-muted";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}
    >
      {formatEnumLabel(text)}
    </span>
  );
};

function PillBtn({ kind = "availability", text, onClick, disabled, title }) {
  const cls =
    kind === "availability"
      ? availabilityClass(text)
      : kind === "condition"
      ? conditionClass(text)
      : "bg-surface-white-subtle text-text-primary ring-1 ring-border-muted";

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition active:scale-[0.99]",
        cls,
        disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90",
      ].join(" ")}
    >
      {formatEnumLabel(text)}
    </button>
  );
}

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
      aria-label="Toggle"
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

const empty = {
  name: "",
  slug: "",
  brand: "",
  price: 0,
  feature: "",
  condition: "new",
  availability: "in_stock",
  featured: false,
  thumbnail: "",
  images: [],
  description: "",
};

export default function DevicesPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // per-row update lock (for featured/availability)
  const [rowBusyId, setRowBusyId] = useState("");

  // delete modal
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const deletingItem = useMemo(
    () => items.find((x) => x._id === deleteId) || null,
    [items, deleteId]
  );

  const buildPayload = (src, overrides = {}) => {
    const merged = { ...src, ...overrides };
    return {
      ...merged,
      name: String(merged.name || "").trim(),
      brand: String(merged.brand || "").trim(),
      slug: String(merged.slug || "").trim(),
      feature: String(merged.feature || "").trim(),
      description: String(merged.description || "").trim(),
      price: Number(merged.price || 0),
      featured: Boolean(merged.featured),
      condition: safeEnum(normalizeEnum(merged.condition), ALLOWED_CONDITIONS, "new"),
      availability: safeEnum(
        normalizeEnum(merged.availability),
        ALLOWED_AVAILABILITY,
        "in_stock"
      ),
      images: (merged.images || []).filter(Boolean).map(String),
      thumbnail: String(merged.thumbnail || ""),
    };
  };

  const cycleAvailability = (cur) => {
    const current = safeEnum(normalizeEnum(cur), ALLOWED_AVAILABILITY, "in_stock");
    const idx = ALLOWED_AVAILABILITY.indexOf(current);
    return ALLOWED_AVAILABILITY[(idx + 1) % ALLOWED_AVAILABILITY.length];
  };

  const load = async ({ pageNext = page } = {}) => {
    const params = {};
    if (q) params.q = q;
    params.page = pageNext;
    params.limit = 20;
    params.sort = q ? "relevance" : "newest";

    const res = await api.get("/api/admin/devices", { params });
    setItems(res.data?.items || []);
    setPages(res.data?.pages || 1);
    setPage(res.data?.page || pageNext);
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
    const normalizedCondition = safeEnum(
      normalizeEnum(it?.condition),
      ALLOWED_CONDITIONS,
      "new"
    );

    const normalizedAvailability = safeEnum(
      normalizeEnum(it?.availability),
      ALLOWED_AVAILABILITY,
      "in_stock"
    );

    setForm({
      ...empty,
      ...it,
      condition: normalizedCondition,
      availability: normalizedAvailability,
      featured: Boolean(it?.featured),
      price: Number(it?.price || 0),
      images: Array.isArray(it?.images) ? it.images : [],
      thumbnail: it?.thumbnail || "",
    });

    setEditingId(it._id);
    setErr("");
    setOpen(true);
  };

  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      if (!form.name?.trim()) throw new Error("Name is required");

      const payload = buildPayload(form);

      if (editingId) await api.put(`/api/admin/devices/${editingId}`, payload);
      else await api.post("/api/admin/devices", payload);

      setOpen(false);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const askDelete = (id) => setDeleteId(id);

  const doDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/api/admin/devices/${deleteId}`);
      setDeleteId(null);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const addImageUpload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadSingle(file);
      setForm((f) => ({
        ...f,
        images: [...(f.images || []), url],
        thumbnail: f.thumbnail || url,
      }));
    } finally {
      setBusy(false);
    }
  };

  const removeImageAt = (idx) => {
    setForm((f) => ({
      ...f,
      images: (f.images || []).filter((_, i) => i !== idx),
    }));
  };

  // ✅ Toggle featured directly in table
  const toggleFeaturedRow = async (it, next) => {
    try {
      setRowBusyId(it._id);
      const payload = buildPayload(it, { featured: next });
      await api.put(`/api/admin/devices/${it._id}`, payload);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Update failed");
    } finally {
      setRowBusyId("");
    }
  };

  // ✅ Toggle availability directly in table (cycles)
  const toggleAvailabilityRow = async (it) => {
    const next = cycleAvailability(it.availability);
    try {
      setRowBusyId(it._id);
      const payload = buildPayload(it, { availability: next });
      await api.put(`/api/admin/devices/${it._id}`, payload);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Update failed");
    } finally {
      setRowBusyId("");
    }
  };

  return (
    <Shell>
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-2xl font-extrabold tracking-tight text-text-primary">
            Devices
          </div>
          <div className="mt-1 text-sm text-text-muted">
            Manage device catalog. Search, edit details, upload images, toggle featured & availability.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
          <InputShell>
            <input
              className="w-full sm:w-[280px] rounded-2xl border border-border-muted bg-white px-4 py-2.5 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
              placeholder="Search by name..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </InputShell>

          <Btn onClick={() => load().catch(() => {})} disabled={busy}>
            Search
          </Btn>

          <button
            className="inline-flex items-center justify-center rounded-xl bg-primary-blue-active px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-[0.99]"
            onClick={startCreate}
          >
            + New
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-border-muted bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-surface-white-subtle text-left">
              <tr className="text-text-primary">
                <th className="p-4 w-20">Thumb</th>
                <th className="p-4">Name</th>
                <th className="p-4 w-40">Brand</th>
                <th className="p-4 w-44">Price</th>
                <th className="p-4 w-28">Featured</th>
                <th className="p-4 w-44">Availability</th>
                <th className="p-4 w-56">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {items.map((it) => {
                const avail = safeEnum(normalizeEnum(it.availability), ALLOWED_AVAILABILITY, "in_stock");
                const cond = safeEnum(normalizeEnum(it.condition), ALLOWED_CONDITIONS, "new");
                const rowDisabled = busy || rowBusyId === it._id;

                return (
                  <tr key={it._id} className="hover:bg-surface-white-subtle/60">
                    <td className="p-4">
                      {it.thumbnail ? (
                        <img
                          src={it.thumbnail}
                          className="h-10 w-10 rounded-xl object-cover ring-1 ring-border-muted"
                          alt=""
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-surface-white-subtle ring-1 ring-border-muted" />
                      )}
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-text-primary">{it.name}</div>
                      <div className="mt-1 text-xs text-text-muted line-clamp-1">
                        {it.feature || "-"}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Pill kind="condition" text={cond} />
                      </div>
                    </td>

                    <td className="p-4 text-text-primary">{it.brand || "-"}</td>

                    {/* ✅ Price formatted */}
                    <td className="p-4 font-semibold text-text-primary">
                      {formatNpr(it.price)}
                    </td>

                    {/* ✅ Featured toggle */}
                    <td className="p-4">
                      <Toggle
                        checked={Boolean(it.featured)}
                        disabled={rowDisabled}
                        onChange={(next) => toggleFeaturedRow(it, next)}
                      />
                    </td>

                    {/* ✅ Availability toggle (click pill to cycle) */}
                    <td className="p-4">
                      <PillBtn
                        kind="availability"
                        text={avail}
                        disabled={rowDisabled}
                        title="Click to change availability"
                        onClick={() => toggleAvailabilityRow(it)}
                      />
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <Btn onClick={() => startEdit(it)} disabled={rowDisabled}>
                          Edit
                        </Btn>
                        <Btn variant="danger" onClick={() => askDelete(it._id)} disabled={rowDisabled}>
                          Delete
                        </Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!items.length ? (
                <tr>
                  <td className="p-10 text-center text-text-muted" colSpan="7">
                    <div className="mx-auto max-w-md">
                      <div className="text-base font-semibold text-text-primary">
                        No devices yet
                      </div>
                      <div className="mt-1 text-sm text-text-muted">
                        Click “New” to add your first device.
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
        title={editingId ? "Edit Device" : "New Device"}
        onClose={() => setOpen(false)}
      >
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
              />
            </InputShell>
          </Field>

          <Field
            label="Slug (optional)"
            hint="If empty, slug will be auto-generated from name."
          >
            <InputShell>
              <input
                className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                value={form.slug || ""}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </InputShell>
          </Field>

          <Field label="Brand">
            <InputShell>
              <input
                className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                value={form.brand || ""}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </InputShell>
          </Field>

          <Field label="Price">
            <InputShell>
              <input
                type="number"
                className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </InputShell>
          </Field>

          <Field label="Feature">
            <InputShell>
              <input
                className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                value={form.feature || ""}
                onChange={(e) => setForm({ ...form, feature: e.target.value })}
              />
            </InputShell>
          </Field>

          <Field label="Condition">
            <InputShell>
              <select
                className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
              >
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="refurbished">Refurbished</option>
                <option value="pre_owned">Pre-Owned</option>
              </select>
            </InputShell>
          </Field>

          <Field label="Availability">
            <InputShell>
              <select
                className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                value={form.availability}
                onChange={(e) => setForm({ ...form, availability: e.target.value })}
              >
                <option value="in_stock">In Stock</option>
                <option value="coming_soon">Coming Soon</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </InputShell>
          </Field>

          <Field label="Featured">
            <div className="flex items-center gap-3 pt-1">
              <Toggle
                checked={Boolean(form.featured)}
                onChange={(v) => setForm({ ...form, featured: v })}
              />
              <span className="text-sm text-text-primary">
                {form.featured ? "Featured" : "Not featured"}
              </span>
            </div>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Description">
              <InputShell>
                <textarea
                  className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted min-h-[110px]"
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </InputShell>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field
              label="Thumbnail URL"
              hint="If empty, we will use the first uploaded image as thumbnail."
            >
              <InputShell>
                <input
                  className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                  value={form.thumbnail || ""}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                />
              </InputShell>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Images">
              <div className="flex flex-wrap gap-2">
                {(form.images || []).map((url, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={url}
                      className="h-16 w-16 object-cover rounded-xl ring-1 ring-border-muted"
                      alt=""
                    />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-white ring-1 ring-border-muted rounded-full w-7 h-7 text-xs font-bold hover:bg-surface-white-subtle"
                      onClick={() => removeImageAt(idx)}
                      disabled={busy}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => addImageUpload(e.target.files?.[0])}
                  disabled={busy}
                />
                <div className="text-xs text-text-muted">
                  Uploads are stored via admin API and saved as URLs in Mongo.
                </div>
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

      {/* Delete Confirm Modal */}
      <Modal open={Boolean(deleteId)} title="Delete Device" onClose={() => setDeleteId(null)}>
        <p className="text-sm text-text-primary">
          Are you sure you want to delete this device?
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
