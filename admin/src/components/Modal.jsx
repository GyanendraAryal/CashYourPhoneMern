import { useEffect } from "react";

export default function Modal({ open = true, title, children, onClose }) {
  // Close on ESC key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKey);
    }

    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  // If explicitly false → don't render
  if (open === false) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal box */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-4 py-3 border-b flex items-center justify-between rounded-t-2xl">
          <div className="font-semibold">
            {title || "Modal"}
          </div>

          <button
            className="text-sm px-2 py-1 border rounded hover:bg-gray-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}