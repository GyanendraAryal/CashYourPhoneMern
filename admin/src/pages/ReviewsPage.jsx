import { useEffect, useMemo, useState } from "react";
import Shell from "../components/Shell";
import Modal from "../components/Modal";
import Field from "../components/Field";
import api from "../lib/api";
import { useAdminStats } from "../context/AdminStatsContext";
import AppImage from "../components/ui/AppImage";

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
    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold shadow-sm";

  const styles =
    variant === "primary"
      ? "bg-primary-blue-active text-white"
      : variant === "danger"
      ? "border bg-red-50 text-red-700"
      : "border bg-white";

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`h-7 w-12 rounded-full ${checked ? "bg-blue-500" : "bg-gray-300"}`}
    />
  );
}

export default function ReviewsPage() {
  const { markByTypeRead } = useAdminStats();

  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [deleteId, setDeleteId] = useState(null);

  /* ✅ FIXED LOAD */
  const load = async () => {
    try {
      const res = await api.get("/api/admin/reviews");
      setItems(res.data?.reviews || []);
    } catch (e) {
      console.error(e);
      setItems([]);
    }
  };

  useEffect(() => {
    markByTypeRead("NEW_REVIEW");
    load();
  }, []);

  const startCreate = () => {
    setForm(empty);
    setEditingId("");
    setOpen(true);
  };

  const startEdit = (it) => {
    setForm({ ...empty, ...it, file: null });
    setEditingId(it._id);
    setOpen(true);
  };

  const onPickAvatar = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);

    setForm((f) => ({
      ...f,
      file,
      avatar: url,
    }));
  };

  const save = async () => {
    setBusy(true);
    setErr("");

    try {
      const fd = new FormData();

      fd.append("name", form.name);
      fd.append("rating", String(form.rating));
      fd.append("message", form.message);
      fd.append("active", form.active ? "true" : "false");

      if (form.file) {
        fd.append("avatar", form.file);
      }

      if (editingId) {
        await api.patch(`/api/admin/reviews/${editingId}`, fd);
      } else {
        await api.post("/api/admin/reviews", fd);
      }

      setOpen(false);
      load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">Reviews</h1>
        <button onClick={startCreate}>+ New</button>
      </div>

      <table className="w-full">
        <tbody>
          {items.map((it) => (
            <tr key={it._id}>
              <td>
                {it.avatar ? (
                  <AppImage
                    src={it.avatar}
                    alt={it.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-200 rounded-full" />
                )}
              </td>

              <td>{it.name}</td>

              <td>
                <Toggle
                  checked={it.active}
                  onChange={(v) => {
                    api.patch(`/api/admin/reviews/${it._id}`, { active: v });
                    load();
                  }}
                />
              </td>

              <td>
                <button onClick={() => startEdit(it)}>Edit</button>
                <button onClick={() => setDeleteId(it._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL */}
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />

          <input type="file" onChange={(e) => onPickAvatar(e.target.files?.[0])} />

          {form.avatar && (
            <AppImage
              src={form.avatar}
              className="h-10 w-10 rounded-full"
            />
          )}

          <button onClick={save}>Save</button>
        </Modal>
      )}
    </Shell>
  );
}