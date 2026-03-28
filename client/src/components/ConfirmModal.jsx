import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ConfirmModal({
  open,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // "danger" | "primary"
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;

    const onEsc = (e) => {
      if (e.key === "Escape") onCancel?.();
    };

    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onCancel]);

  const confirmBtn =
    variant === "danger"
      ? "bg-secondary-violet-active hover:bg-secondary-violet-hover focus:ring-secondary-violet-muted"
      : "bg-primary-blue-active hover:opacity-95 focus:ring-primary-blue-muted";

  const confirmRing =
    variant === "danger"
      ? "focus:ring-secondary-violet-muted"
      : "focus:ring-primary-blue-muted";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="confirm-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center px-4"
        >
          {/* Backdrop (softer) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={loading ? undefined : onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-border-muted"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
          >
            {/* Title + message (lighter) */}
            <h2 id="confirm-title" className="text-base font-semibold text-text-primary">
              {title}
            </h2>
            <p id="confirm-message" className="mt-2 text-sm leading-6 text-text-muted">
              {message}
            </p>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="rounded-xl border border-border-muted bg-white px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-white-subtle transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-4 ${confirmBtn} ${confirmRing} disabled:opacity-50`}
              >
                {loading ? "Please wait..." : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
