export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white rounded-lg shadow max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-4 py-3 border-b flex items-center justify-between rounded-t-lg">
          <div className="font-semibold">{title}</div>
          <button
            className="text-sm px-2 py-1 border rounded hover:bg-surface-white-subtle"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
