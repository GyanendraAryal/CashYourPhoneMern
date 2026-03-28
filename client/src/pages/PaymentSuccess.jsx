import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { verifyEsewaPayment } from "../services/esewaService";

export default function PaymentSuccess() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const data = params.get("data") || "";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const hasData = useMemo(() => Boolean(data && data.length > 10), [data]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!hasData) {
        setLoading(false);
        setErr("Missing payment data. Please try again from checkout.");
        return;
      }

      try {
        setLoading(true);
        setErr("");
        const res = await verifyEsewaPayment(data);
        const orderId = res?.data?.orderId;
        toast.success("Payment verified successfully!");
        if (orderId) nav(`/order-success/${orderId}?paid=1&provider=esewa`);
        else nav("/my-orders");
      } catch (e) {
        const msg = e?.message || "Payment verification failed.";
        if (mounted) {
          setErr(msg);
          toast.error(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [data, hasData, nav]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-2">Payment Success</h1>
      <p className="text-sm text-text-muted mb-6">
        We&apos;re verifying your payment with eSewa. Please don&apos;t close this page.
      </p>

      <div className="rounded-xl border bg-white p-4">
        {loading ? (
          <div className="text-sm">Verifying…</div>
        ) : err ? (
          <div className="space-y-3">
            <div className="text-sm text-primary-blue-active">{err}</div>
            <div className="flex gap-3">
              <button
                onClick={() => nav("/checkout")}
                className="bg-black text-white px-4 py-2 rounded"
              >
                Back to Checkout
              </button>
              <Link className="px-4 py-2 rounded border" to="/my-orders">
                My Orders
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-sm">Verified. Redirecting…</div>
        )}
      </div>
    </div>
  );
}
