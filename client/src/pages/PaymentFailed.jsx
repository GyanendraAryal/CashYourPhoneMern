import { useNavigate } from "react-router-dom";

export default function PaymentFailed() {
  const nav = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-2">Payment Failed</h1>
      <p className="text-sm text-text-muted mb-6">
        Your eSewa payment was not completed. You can retry from checkout.
      </p>

      <div className="rounded-xl border bg-white p-4 flex items-center justify-between gap-3">
        <div className="text-sm">If you were charged, please contact support with your order number.</div>
        <button
          onClick={() => nav("/checkout")}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
