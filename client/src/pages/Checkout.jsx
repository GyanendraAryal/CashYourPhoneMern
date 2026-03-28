import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createOrderFromCart } from "../services/orderService";
import { initiateEsewaPayment } from "../services/esewaService";
import { useCart } from "../context/CartContext";

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const nav = useNavigate();
  const { cart, refreshCart } = useCart();
  const formRef = useRef(null);

  const [orderId, setOrderId] = useState("");

  const [contact, setContact] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
  });

  const errors = useMemo(() => {
    const e = {};
    if (!contact.fullName.trim()) e.fullName = "Full name is required";
    if (!contact.phone.trim()) e.phone = "Phone is required";
    if (!contact.address.trim()) e.address = "Address is required";
    // email optional, but if provided it should look like an email
    if (contact.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
      e.email = "Invalid email";
    }
    return e;
  }, [contact]);

  const canSubmit = Object.keys(errors).length === 0 && !loading;

  const onChange = (key) => (e) => {
    setContact((c) => ({ ...c, [key]: e.target.value }));
  };

  const placeOrder = async () => {
    if (!canSubmit) {
      toast.error("Please fix the form errors before placing the order.");
      return;
    }

    const hasIssues = Boolean(cart?.flags?.hasIssues);
    if (hasIssues) {
      toast.error("Fix cart issues (price changes / out of stock) before placing the order.");
      return;
    }

    setLoading(true);
    try {
      const res = await createOrderFromCart({
        fullName: contact.fullName.trim(),
        phone: contact.phone.trim(),
        email: contact.email.trim(),
        address: contact.address.trim(),
      });

      const id = res?._id || res?.id;
      if (!id) throw new Error("Order created but no id returned.");
      setOrderId(String(id));
      await refreshCart?.();
      toast.success("Order created. You can pay with eSewa now.");
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to place order. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const payWithEsewa = async () => {
    if (!orderId) {
      toast.error("Please place the order first.");
      return;
    }

    setPaying(true);
    try {
      const res = await initiateEsewaPayment(orderId);
      const paymentUrl = res?.data?.paymentUrl;
      const fields = res?.data?.fields;
      if (!paymentUrl || !fields) throw new Error("Failed to initiate eSewa payment.");

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
      const msg = e?.message || "Failed to start payment.";
      toast.error(msg);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Checkout</h1>

      <div className="rounded-xl border bg-white p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Order Summary</div>
            <div className="text-xs text-text-muted">Items: {(cart?.items || []).length}</div>
          </div>
          <div className="text-sm">
            Total: <b>NPR {Number(cart?.subtotal || 0).toLocaleString("en-NP")}</b>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input
            value={contact.fullName}
            onChange={onChange("fullName")}
            className="w-full border rounded px-3 py-2"
            placeholder="Your full name"
            autoComplete="name"
          />
          {errors.fullName && (
            <div className="text-sm text-primary-blue-active mt-1">{errors.fullName}</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            value={contact.phone}
            onChange={onChange("phone")}
            className="w-full border rounded px-3 py-2"
            placeholder="98xxxxxxxx"
            autoComplete="tel"
          />
          {errors.phone && (
            <div className="text-sm text-primary-blue-active mt-1">{errors.phone}</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email (optional)</label>
          <input
            value={contact.email}
            onChange={onChange("email")}
            className="w-full border rounded px-3 py-2"
            placeholder="you@example.com"
            autoComplete="email"
          />
          {errors.email && (
            <div className="text-sm text-primary-blue-active mt-1">{errors.email}</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <textarea
            value={contact.address}
            onChange={onChange("address")}
            className="w-full border rounded px-3 py-2 min-h-[96px]"
            placeholder="City, street, landmarks…"
            autoComplete="street-address"
          />
          {errors.address && (
            <div className="text-sm text-primary-blue-active mt-1">{errors.address}</div>
          )}
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button
            disabled={!canSubmit}
            onClick={placeOrder}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {loading ? "Placing..." : "Place Order"}
          </button>
        </div>

        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            disabled={!orderId || paying}
            onClick={payWithEsewa}
            className="bg-primary-blue-active text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {paying ? "Redirecting..." : "Pay with eSewa"}
          </button>

          {orderId ? (
            <button
              type="button"
              className="px-4 py-2 rounded border"
              onClick={() => nav(`/order-success/${orderId}`)}
            >
              Pay Later
            </button>
          ) : (
            <div className="text-xs text-text-muted">
              Place the order first to generate a payment request.
            </div>
          )}
        </div>
      </div>

      {/* kept for future enhancement (if you want to render an actual form) */}
      <form ref={formRef} className="hidden" />
    </div>
  );
}
