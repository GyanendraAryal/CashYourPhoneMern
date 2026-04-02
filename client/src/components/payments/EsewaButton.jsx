import { useState } from "react";
import toast from "react-hot-toast";
import { initiateEsewaPayment } from "../../services/esewaService";

export default function EsewaButton({ orderId, amount, className = "" }) {
  const [paying, setPaying] = useState(false);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!orderId) {
      toast.error("Invalid order ID.");
      return;
    }

    setPaying(true);
    try {
      const res = await initiateEsewaPayment(orderId);
      const paymentUrl = res?.data?.paymentUrl;
      const fields = res?.data?.fields;
      
      if (!paymentUrl || !fields) {
        throw new Error("Failed to initiate eSewa payment.");
      }

      // Build & auto-submit an HTML form to eSewa
      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentUrl;
      form.style.display = "none";

      Object.entries(fields).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = String(v);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to start payment.";
      toast.error(msg);
    } finally {
      setPaying(false);
    }
  };

  return (
    <button
      disabled={paying}
      onClick={handlePay}
      className={`bg-primary-blue-active text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-60 ${className}`}
    >
      {paying ? "Redirecting..." : "Pay with eSewa"}
    </button>
  );
}
