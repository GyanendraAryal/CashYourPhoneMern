import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { initiateEsewaCheckout } from "../services/esewaService";
import { useCart } from "../context/CartContext";

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { cart, fetchCart, loading: cartLoading } = useCart();

  // Safety: Redirect if cart is empty after loading
  if (cartLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-text-muted">Syncing your cart...</p>
      </div>
    );
  }

  if (!cartLoading && (!cart || !cart.items || cart.items.length === 0)) {
    nav("/cart");
    return null;
  }

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
    if (contact.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
      e.email = "Invalid email";
    }
    return e;
  }, [contact]);

  const canSubmit = Object.keys(errors).length === 0 && !loading;

  const onChange = (key) => (e) => {
    setContact((c) => ({ ...c, [key]: e.target.value }));
  };

  const handleEsewaCheckout = async () => {
    if (!canSubmit) {
      toast.error("Please fix the form errors before proceeding.");
      return;
    }

    const hasIssues = Boolean(cart?.flags?.hasIssues);
    if (hasIssues) {
      toast.error("Fix cart issues (price changes / out of stock) before checking out.");
      return;
    }

    setLoading(true);
    try {
      const latestCart = await fetchCart?.();
      
      if (!latestCart || !Array.isArray(latestCart.items) || latestCart.items.length === 0) {
        toast.error("Your cart is empty on the server. Please add items again.");
        nav("/cart");
        return;
      }

      // Initiate checkout session with contact details (1-2-3 Rule: Do not create Order yet)
      const contactPayload = {
        fullName: contact.fullName.trim(),
        phone: contact.phone.trim(),
        email: contact.email.trim(),
        address: contact.address.trim(),
      };
      
      const res = await initiateEsewaCheckout(contactPayload);
      const { paymentUrl, fields } = res?.data || res || {};

      if (!paymentUrl || !fields) {
         throw new Error("Invalid response from payment server.");
      }

      // Dynamically create and submit eSewa form
      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentUrl;
      form.style.display = "none";

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      
      // We don't unlock loading here because the browser is navigating away to eSewa.
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to initiate checkout. Please try again.";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Checkout</h1>

      <div className="rounded-xl border bg-white p-4 mb-4 shadow-sm">
        <div className="font-semibold mb-3 border-b pb-2">Order Summary</div>
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {(cart?.items || []).map((it, idx) => (
            <div key={it.id ?? idx} className="flex gap-3 items-center">
              <img 
                src={it.thumbnailSnapshot || "/phone-placeholder.png"} 
                alt={it.nameSnapshot || "Device"} 
                className="w-12 h-12 rounded-lg object-cover border border-border-muted"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{it.nameSnapshot || "Device"}</div>
                <div className="text-xs text-text-muted">
                  Qty: {it.qty} × NPR {Number(it.priceSnapshot || it.unitPrice || 0).toLocaleString()}
                </div>
              </div>
              <div className="text-sm font-bold">
                NPR {Number((it.priceSnapshot || it.unitPrice || 0) * it.qty).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t flex items-center justify-between">
          <div className="text-sm text-text-muted">Total Amount</div>
          <div className="text-lg font-extrabold text-text-primary">
            NPR {Number(cart?.total || 0).toLocaleString("en-NP")}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm p-4 space-y-4">
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
            <div className="text-sm text-red-500 mt-1">{errors.fullName}</div>
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
            <div className="text-sm text-red-500 mt-1">{errors.phone}</div>
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
            <div className="text-sm text-red-500 mt-1">{errors.email}</div>
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
            <div className="text-sm text-red-500 mt-1">{errors.address}</div>
          )}
        </div>

        <div className="pt-4 flex flex-col gap-4">
          <button
            disabled={!canSubmit}
            onClick={handleEsewaCheckout}
            className="w-full bg-[#60BB46] hover:bg-[#52A33A] text-white font-bold px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <img src="/esewa_logo.png" alt="eSewa" className="h-5 object-contain filter brightness-0 invert" />
            )}
            {loading ? "Redirecting to eSewa..." : `Pay NPR ${Number(cart?.total || 0).toLocaleString()} via eSewa`}
          </button>
          <p className="text-xs text-center text-text-muted mt-2">
            By proceeding, you agree to place this order and pay through eSewa's secure portal. Your order will only be created upon successful payment verification.
          </p>

          {/* Sandbox Indicator */}
          <div className="rounded-lg bg-surface-white-subtle border border-border-muted p-3 mt-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#60BB46] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">Sandbox Environment</span>
            </div>
            <p className="text-[10px] leading-relaxed text-text-muted">
              Use these test credentials on the eSewa page:
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-white p-1.5 rounded border border-border-muted">
                <div className="font-bold text-text-primary">ID: 9841516713</div>
                <div className="text-text-muted">Test ID</div>
              </div>
              <div className="bg-white p-1.5 rounded border border-border-muted">
                <div className="font-bold text-text-primary">Pass: esewa123</div>
                <div className="text-text-muted">Test Password</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
