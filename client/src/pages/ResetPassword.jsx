import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { resetPassword } from "../services/authRecoveryService";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const tokenFromUrl = params.get("token") || "";
  const stateIdentifier = location.state?.identifier || "";
  const stateMethod = location.state?.method || (tokenFromUrl ? "email" : "otp");

  const [method] = useState(stateMethod); // lock it in
  const [identifier, setIdentifier] = useState(stateIdentifier);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 👇 Eye toggles
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const needsOtp = useMemo(
    () => method === "otp" && !tokenFromUrl,
    [method, tokenFromUrl]
  );

  useEffect(() => {
    if (method === "email" && !tokenFromUrl) {
      toast.error("Reset link token missing. Please request a new reset link.");
    }
  }, [method, tokenFromUrl]);

  async function onSubmit(e) {
    e.preventDefault();

    if (newPassword.length < 8) {
      return toast.error("Password must be at least 8 characters.");
    }
    if (newPassword !== confirm) {
      return toast.error("Passwords do not match.");
    }

    if (needsOtp) {
      if (!identifier.trim()) return toast.error("Please enter your email/phone.");
      if (!otp.trim()) return toast.error("Please enter the OTP code.");
    }

    try {
      setSubmitting(true);

      await resetPassword({
        identifier: needsOtp ? identifier.trim() : undefined,
        otp: needsOtp ? otp.trim() : undefined,
        token: method === "email" ? tokenFromUrl : undefined,
        newPassword,
      });

      toast.success("Password reset successful. Please log in.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err?.message || "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-white-subtle px-4">
      <div className="w-full max-w-md bg-white p-6 md:p-8 rounded-2xl shadow">
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/login"
            className="text-sm text-text-muted hover:text-text-primary transition"
          >
            ← Back to Login
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-[var(--brand-dark)]">
          Reset Password
        </h1>
        <p className="text-text-muted mb-6">
          {method === "email"
            ? "Set a new password using your email reset link."
            : "Enter the OTP code and set a new password."}
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          {needsOtp ? (
            <>
              <input
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-dark)]"
                placeholder="Email or Phone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
              <input
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-dark)]"
                placeholder="OTP Code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </>
          ) : null}

          {/* New Password + Eye */}
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              className="w-full p-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-dark)]"
              placeholder="New Password (min 8 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm Password + Eye */}
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              className="w-full p-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-dark)]"
              placeholder="Confirm New Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            disabled={submitting}
            className="w-full bg-primary-blue-active text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-60"
            type="submit"
          >
            {submitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-6 text-sm text-center text-text-muted">
          Need to start over?{" "}
          <Link
            to="/forgot-password"
            className="text-primary-blue-active font-semibold hover:underline"
          >
            Request again
          </Link>
        </div>
      </div>
    </div>
  );
}
