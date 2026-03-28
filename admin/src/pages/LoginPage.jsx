import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/api";
import { setAuthed } from "../lib/auth";
import { motion, AnimatePresence } from "framer-motion";

function EyeIcon({ off }) {
  return off ? (
    // eye-off
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9.5 5.5A10.8 10.8 0 0112 5c5 0 9 4.5 10 7-0.35 0.9-1.2 2.4-2.6 3.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.1 6.1C4.2 7.5 2.8 9.7 2 12c1 2.5 5 7 10 7 1.2 0 2.3-0.2 3.3-0.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    // eye
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path
        d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ease = [0.22, 1, 0.36, 1];

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.35, ease } },
};

const cardVariants = {
  initial: { opacity: 0, y: 18, scale: 0.985, filter: "blur(6px)" },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease },
  },
};

const headerVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

const errorVariants = {
  initial: { opacity: 0, y: -6, height: 0 },
  animate: { opacity: 1, y: 0, height: "auto", transition: { duration: 0.22, ease } },
  exit: { opacity: 0, y: -6, height: 0, transition: { duration: 0.18, ease } },
};

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0 && !loading;
  }, [email, password, loading]);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setErr("");
    setLoading(true);

    try {
      const loginPromise = api.post("/api/admin/auth/login", { email, password });

      toast.promise(loginPromise, {
        loading: "Signing in...",
        success: "Welcome back!",
        error: (err) => err?.response?.data?.message || "Invalid credentials",
      });

      await loginPromise;

      setAuthed(true);
      nav("/", { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="relative min-h-screen overflow-hidden bg-surface-white-subtle/60 flex items-center justify-center p-4"
    >
      {/* Background ambience (subtle glows) */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease }}
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary-blue-muted/40 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease, delay: 0.05 }}
          className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-green-200/30 blur-3xl"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.65),transparent_55%)]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <motion.div variants={headerVariants} initial="initial" animate="animate" className="mb-6 text-center">

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-text-primary">Admin Login</h1>
          <p className="mt-1 text-lg text-text-muted">CashYourPhone</p>
        </motion.div>

        {/* Card */}
        <motion.form
          onSubmit={submit}
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover={{ y: -2 }}
          transition={{ ease }}
          className="rounded-2xl border border-border-muted bg-white/90 backdrop-blur p-6 shadow-sm"
        >
          <AnimatePresence>
            {err ? (
              <motion.div
                key="err"
                variants={errorVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="mb-4 overflow-hidden"
              >
                <motion.div
                  initial={{ x: 0 }}
                  animate={{ x: [0, -6, 6, -4, 4, 0] }}
                  transition={{ duration: 0.35, ease }}
                  className="rounded-xl border border-primary-blue-muted bg-primary-blue-muted px-4 py-3 text-sm text-primary-blue-active"
                >
                  {err}
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="space-y-4">
            {/* Email */}
            <label className="block">
              <div className="text-sm font-semibold text-text-primary">Email</div>

              <motion.div
                whileFocusWithin={{ scale: 1.01 }}
                transition={{ duration: 0.18, ease }}
                className="mt-2 rounded-2xl transition-shadow duration-200 focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.08)]"
              >
                <input
                  className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-border-muted"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="username"
                />
              </motion.div>
            </label>

            {/* Password */}
            <label className="block">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-text-primary">Password</div>
              </div>

              <motion.div
                whileFocusWithin={{ scale: 1.01 }}
                transition={{ duration: 0.18, ease }}
                className="relative mt-2 rounded-2xl transition-shadow duration-200 focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.08)]"
              >
                <input
                  type={showPass ? "text" : "password"}
                  className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 pr-12 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-border-muted"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />

                <motion.button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.03 }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-text-muted hover:bg-surface-white-subtle"
                  aria-label={showPass ? "Hide password" : "Show password"}
                  title={showPass ? "Hide password" : "Show password"}
                >
                  <motion.div
                    initial={false}
                    animate={{ rotate: showPass ? 12 : 0, opacity: 1 }}
                    transition={{ duration: 0.18, ease }}
                  >
                    <EyeIcon off={showPass} />
                  </motion.div>
                </motion.button>
              </motion.div>
            </label>

            {/* Visible Security Status block */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease, delay: 0.12 }}
              className="rounded-2xl border border-border-muted bg-surface-white-subtle/60 px-4 py-3"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
                <span>Security status</span>
                <span className="text-text-primary">
                  {loading
                    ? "Authenticating..."
                    : canSubmit
                    ? "Ready to sign in"
                    : "Waiting for credentials"}
                </span>
              </div>

              <div className="mt-2 h-2 w-full rounded-full bg-white shadow-inner overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{
                    width: loading
                      ? "100%"
                      : canSubmit
                      ? "80%"
                      : email || password
                      ? "40%"
                      : "12%",
                  }}
                  transition={{ duration: 0.35, ease }}
                  className="h-full rounded-full bg-primary-blue-active"
                />
              </div>

              <AnimatePresence>
                {loading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white"
                  >
                    <motion.div
                      animate={{ x: ["-40%", "140%"] }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                      className="h-full w-1/3 bg-green-200"
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>

            {/* Submit */}
            <motion.button
              disabled={!canSubmit}
              whileHover={canSubmit ? { y: -1 } : undefined}
              whileTap={canSubmit ? { scale: 0.985 } : undefined}
              transition={{ duration: 0.18, ease }}
              className="relative inline-flex w-full items-center justify-center rounded-2xl bg-primary-blue-active px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
            >
              {/* strong visible shine */}
              <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                <motion.span
                  initial={{ x: "-140%", opacity: 0.0 }}
                  animate={{ x: "140%", opacity: 0.45 }}
                  transition={{
                    duration: 1.0,
                    ease,
                    repeat: Infinity,
                    repeatDelay: 0.9,
                  }}
                  className="absolute top-0 h-full w-1/2 bg-white/35 blur-xl"
                />
              </span>

              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <motion.span
                    className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
                  />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </motion.button>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.15 }}
          className="mt-5 text-center text-xs text-text-muted"
        >
          Use this panel only if you’re an authorized admin.
        </motion.div>
      </div>
    </motion.div>
  );
}
