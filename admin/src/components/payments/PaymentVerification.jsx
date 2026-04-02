import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../lib/api";

export default function PaymentVerification({ paymentId, onVerified }) {
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (!paymentId) return;
    setLoading(true);
    try {
      const res = await api.post(`/api/v1/payments/admin/verify/${paymentId}`);
      toast.success(res.data?.message || "Payment verified!");
      if (onVerified) onVerified(res.data.payment);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-border-muted">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-text-primary">Manual Verification</div>
          <p className="text-xs text-text-muted max-w-[240px]">
            Check eSewa status if this payment is stuck in 'initiated' but the user says they paid.
          </p>
        </div>
        <button
          onClick={verify}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black/90 disabled:opacity-50 active:scale-95 transition-all"
        >
          {loading ? "Checking..." : "Verify Now"}
        </button>
      </div>
    </div>
  );
}
