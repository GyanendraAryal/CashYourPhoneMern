export default function Field({ label, children, hint }) {
  return (
    <label className="block">
      <div className="text-sm font-medium mb-1">{label}</div>
      {children}
      {hint ? <div className="text-xs text-text-muted mt-1">{hint}</div> : null}
    </label>
  );
}
