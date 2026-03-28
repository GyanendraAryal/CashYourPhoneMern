import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { requestPasswordReset } from "../services/authRecoveryService";

function isEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [method, setMethod] = useState("otp"); // "otp" | "email"
  const [identifier, setIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const helpText = useMemo(() => {
    return method === "otp"
      ? "We’ll send a one-time code (OTP) to your email or phone."
      : "We’ll email you a secure reset link.";
  }, [method]);

  async function onSubmit(e) {
    e.preventDefault();

    const id = identifier.trim();
    if (!id) return toast.error("Please enter your email or phone.");

    // Optional UX: if email-method is selected but identifier isn't email
    if (method === "email" && !isEmail(id)) {
      return toast.error("For email link reset, please enter a valid email.");
    }

    try {
      setSubmitting(true);
      await requestPasswordReset({ identifier: id, method });

      toast.success(
        "If an account exists, we sent reset instructions. Please check your inbox/SMS."
      );

      // For OTP method, take them to reset page with identifier
      if (method === "otp") {
        navigate("/reset-password", { state: { identifier: id, method: "otp" } });
      }
    } catch (err) {
      toast.error(err?.message || "Failed to start password reset.");
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
          Forgot Password
        </h1>
        <p className="text-text-muted mb-6">{helpText}</p>

        {/* Method toggle */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMethod("otp")}
            className={[
              "rounded-xl border px-3 py-2 text-sm font-semibold transition",
              method === "otp"
                ? "border-primary-blue-active bg-primary-blue-muted/20 text-primary-blue-active"
                : "border-border-muted text-text-muted hover:bg-surface-white-subtle",
            ].join(" ")}
          >
            OTP Code
          </button>

          <button
            type="button"
            onClick={() => setMethod("email")}
            className={[
              "rounded-xl border px-3 py-2 text-sm font-semibold transition",
              method === "email"
                ? "border-primary-blue-active bg-primary-blue-muted/20 text-primary-blue-active"
                : "border-border-muted text-text-muted hover:bg-surface-white-subtle",
            ].join(" ")}
          >
            Email Link
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-dark)]"
            placeholder={method === "email" ? "Email" : "Email or Phone"}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />

          <button
            disabled={submitting}
            className="w-full bg-primary-blue-active text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-60"
            type="submit"
          >
            {submitting
              ? "Sending..."
              : method === "otp"
              ? "Send OTP"
              : "Send Reset Link"}
          </button>

          {method === "email" ? (
            <p className="text-xs text-text-muted">
              After you click the link in your email, you’ll come back here to set
              a new password.
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
