import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  helper,
  autoComplete = "off",
  showStrength = false,
}) {
  const [show, setShow] = useState(false);

  const strength = (() => {
    const v = String(value || "");
    let score = 0;

    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;

    if (score <= 1) return { score, label: "Weak", color: "red" };
    if (score === 2) return { score, label: "Fair", color: "amber" };
    if (score === 3) return { score, label: "Good", color: "blue" };
    return { score, label: "Strong", color: "green" };
  })();

  const activeColor =
    strength.color === "red"
      ? "bg-primary-blue-muted"
      : strength.color === "amber"
      ? "bg-primary-blue-muted"
      : strength.color === "blue"
      ? "bg-primary-blue"
      : "bg-success-green";

  return (
    <label className="block">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-text-primary">{label}</span>
      </div>

      {helper ? (
        <div className="mt-1 text-xs text-text-muted">{helper}</div>
      ) : null}

      <div className="relative mt-2">
        <div className="rounded-2xl transition-shadow duration-200 focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.08)]">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 pr-12 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-border-muted"
          />
        </div>

        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-text-muted hover:bg-surface-white-subtle active:scale-[0.98]"
          aria-label={show ? "Hide password" : "Show password"}
          title={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
              <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M9.5 5.5A10.8 10.8 0 0112 5c5 0 9 4.5 10 7-0.35 0.9-1.2 2.4-2.6 3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M6.1 6.1C4.2 7.5 2.8 9.7 2 12c1 2.5 5 7 10 7 1.2 0 2.3-0.2 3.3-0.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* ✅ ONLY strength indicator (colored segmented bar under input) */}
      {showStrength && value ? (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex w-full gap-1">
            {Array.from({ length: 4 }).map((_, i) => {
              const active = i < strength.score;
              return (
                <div
                  key={i}
                  className={[
                    "h-1.5 flex-1 rounded-full transition-all duration-300",
                    active ? activeColor : "bg-surface-white-subtle",
                  ].join(" ")}
                />
              );
            })}
          </div>

          <span className="w-14 text-right text-xs font-semibold text-text-muted">
            {strength.label}
          </span>
        </div>
      ) : null}
    </label>
  );
}




export default function ChangePassword() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await api.patch("/api/v1/users/change-password", {
        currentPassword,
        newPassword,
      });

      // Backend clears auth cookies; we also clear client state
      await logout();
      toast.success("Password changed. Please log in again.");
      navigate("/login", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to change password";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-surface-white-subtle/60">
      <div className="container mx-auto px-4 py-10 md:px-8 md:py-12">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="rounded-2xl border border-border-muted bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
                  Change Password
                </h1>
                <p className="mt-2 text-sm text-text-muted md:text-base">
                  For your security, you will be logged out after changing your
                  password.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center rounded-xl border border-border-muted bg-white px-4 py-2 text-sm font-semibold text-text-primary shadow-sm hover:bg-surface-white-subtle active:scale-[0.99]"
              >
                Back
              </button>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={submit}
            className="mt-6 rounded-2xl border border-border-muted bg-white p-6 shadow-sm md:p-7"
          >
            <div className="space-y-5">
              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Enter your current password"
                autoComplete="current-password"
              />

              <PasswordField
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Create a new password (min 8 chars)"
                helper="Use 8+ chars, with numbers or symbols for better security."
                autoComplete="new-password"
                showStrength
              />


              <PasswordField
                label="Confirm New Password"
                value={confirmNewPassword}
                onChange={setConfirmNewPassword}
                placeholder="Re-type the new password"
                autoComplete="new-password"
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-text-muted">
                You’ll be redirected to login after update.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--brand-dark)] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60 sm:w-auto"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>

          {/* Tips */}
          <div className="mt-6 rounded-2xl border border-border-muted bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="font-bold text-text-primary">Password tips</div>
              <span className="rounded-full bg-surface-white-subtle px-3 py-1 text-xs font-semibold text-text-primary ring-1 ring-border-muted">
                Recommended
              </span>
            </div>

            <ul className="mt-3 space-y-2 text-sm text-text-primary">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-surface-white-subtle" />
                Use at least <span className="font-semibold">8+ characters</span>.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-surface-white-subtle" />
                Mix letters and numbers (and symbols if possible).
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-surface-white-subtle" />
                Avoid your name, phone number, or easy patterns.
              </li>
            </ul>
          </div>

          {/* Small footer space */}
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
