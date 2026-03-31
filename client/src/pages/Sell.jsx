import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSellRequest } from "../services/sellRequestService";
import { useAuth } from "../context/AuthContext";

const CONDITION_MAP = {
  New: "new",
  "Like New": "like_new",
  Refurbished: "refurbished",
  "Pre-Owned": "pre_owned",
};

function FieldLabel({ children, required }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="text-sm font-semibold text-text-primary">{children}</span>
      {required ? (
        <span className="text-xs font-semibold text-text-muted">Required</span>
      ) : null}
    </div>
  );
}

function InputShell({ children }) {
  return (
    <div className="rounded-2xl transition-shadow duration-200 focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.08)]">
      {children}
    </div>
  );
}

export default function Sell() {
  const navigate = useNavigate();
  const { user, booting } = useAuth();

  const [form, setForm] = useState({
    brand: "",
    model: "",
    storage: "",
    condition: "",
    price: "",
    name: "",
    phone: "",
    requestType: "sell", // "sell" | "exchange"
  });

  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files || []);
    // Validation: prevent duplicate files or excessive counts if needed
    // For now, we append to existing or replace? Let's REPLACE to match previous behavior but add preview
    setImages(files);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (booting) return;

    if (!user) {
      setMessage("⚠️ Please login to submit a sell request.");
      return navigate("/login", { state: { from: { pathname: "/sell" } } });
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      // ✅ Backend REQUIRED fields
      formData.append("fullName", form.name || "");
      formData.append("phone", form.phone || "");

      // ✅ Build backend deviceName from your fields
      const deviceName = [form.brand, form.model, form.storage]
        .filter(Boolean)
        .join(" ")
        .trim();

      formData.append("deviceName", deviceName);

      // ✅ Backend fields
      const normalizedCondition = CONDITION_MAP[form.condition] || "new";
      formData.append("deviceCondition", normalizedCondition);

      if (form.price) formData.append("expectedPrice", String(form.price));

      formData.append("requestType", form.requestType);

      // ✅ Images field name MUST be "images"
      images.forEach((f) => formData.append("images", f));

      const res = await createSellRequest(formData);

      if (res.status >= 200 && res.status < 300) {
        setMessage("✅ Sell request submitted successfully!");
        setForm({
          brand: "",
          model: "",
          storage: "",
          condition: "",
          price: "",
          name: "",
          phone: "",
          requestType: "sell",
        });
        setImages([]);
      } else {
        setMessage("❌ Failed to submit sell request.");
      }
    } catch (err) {
      console.warn("Sell request failed:", err);
      setMessage(
        err?.response?.data?.message ||
          "❌ Failed to submit sell request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-surface-white-subtle/60">
      <div className="container mx-auto px-4 py-10 md:px-8 md:py-12">
        <div className="mx-auto max-w-5xl">
          {/* Top info bar */}
          {user ? (
            <div className="mb-6 rounded-2xl border border-border-muted bg-white px-5 py-4 shadow-sm">
              <div className="text-sm text-text-primary">
                You’re logged in as{" "}
                <span className="font-semibold text-text-primary">{user.name}</span>
                {user.email ? (
                  <span className="text-text-muted"> ({user.email})</span>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Page header */}
          <div className="rounded-2xl border border-border-muted bg-white px-6 py-6 shadow-sm md:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
                  Sell Your Phone
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-text-muted md:text-base">
                  Share your phone details and we’ll review your request as soon as
                  possible.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center rounded-xl border border-border-muted bg-white px-4 py-2 text-sm font-semibold text-text-primary shadow-sm hover:bg-surface-white-subtle active:scale-[0.99]"
              >
                Back
              </button>
            </div>

            {!booting && !user ? (
              <div className="mt-5 rounded-2xl border border-primary-blue-muted bg-primary-blue-muted px-5 py-4 text-sm text-primary-blue-active">
                You need to{" "}
                <button
                  className="font-semibold underline underline-offset-2"
                  onClick={() =>
                    navigate("/login", { state: { from: { pathname: "/sell" } } })
                  }
                >
                  login
                </button>{" "}
                to submit a sell request.
              </div>
            ) : null}
          </div>

          {/* Form card */}
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-2xl border border-border-muted bg-white p-6 shadow-sm md:p-8"
          >
            {/* Goal Toggle */}
            <div className="mb-8">
              <FieldLabel required>I want to</FieldLabel>
              <div className="flex gap-3">
                {["sell", "exchange"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, requestType: type }))}
                    className={`flex-1 rounded-2xl border py-4 text-sm font-bold transition-all ${
                      form.requestType === type
                        ? "border-primary-blue-active bg-primary-blue-muted/30 text-primary-blue-active shadow-[0_0_0_1px_rgba(37,99,235,1)]"
                        : "border-border-muted bg-white text-text-muted hover:bg-surface-white-subtle"
                    }`}
                  >
                    {type === "sell" ? "💰 Sell for Cash" : "🔄 Exchange Phone"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* Brand */}
              <div>
                <FieldLabel required>Select Brand</FieldLabel>
                <InputShell>
                  <select
                    name="brand"
                    onChange={handleChange}
                    value={form.brand}
                    required
                    className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                  >
                    <option value="">Select Brand</option>
                    <option>Apple</option>
                    <option>Samsung</option>
                    <option>OnePlus</option>
                    <option>Mi</option>
                    <option>Vivo</option>
                    <option>Oppo</option>
                  </select>
                </InputShell>
              </div>

              {/* Model */}
              <div>
                <FieldLabel required>Model</FieldLabel>
                <InputShell>
                  <input
                    type="text"
                    name="model"
                    placeholder="e.g., iPhone 14 Pro"
                    value={form.model}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-border-muted"
                  />
                </InputShell>
              </div>

              {/* Storage */}
              <div>
                <FieldLabel>Storage</FieldLabel>
                <InputShell>
                  <input
                    type="text"
                    name="storage"
                    placeholder="e.g., 128GB"
                    value={form.storage}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-border-muted"
                  />
                </InputShell>
              </div>

              {/* Condition */}
              <div>
                <FieldLabel required>Condition</FieldLabel>
                <InputShell>
                  <select
                    name="condition"
                    value={form.condition}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-border-muted"
                  >
                    <option value="">Choose condition</option>
                    <option>New</option>
                    <option>Like New</option>
                    <option>Refurbished</option>
                    <option>Pre-Owned</option>
                  </select>
                </InputShell>
              </div>

              {/* Expected price */}
              <div>
                <FieldLabel>Expected Price (NPR)</FieldLabel>
                <InputShell>
                  <input
                    type="number"
                    name="price"
                    placeholder="e.g., 45000"
                    value={form.price}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-border-muted"
                  />
                </InputShell>
              </div>

              {/* Name */}
              <div>
                <FieldLabel required>Your Name</FieldLabel>
                <InputShell>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-border-muted"
                  />
                </InputShell>
              </div>

              {/* Phone */}
              <div className="md:col-span-2">
                <FieldLabel required>Phone Number</FieldLabel>
                <InputShell>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="e.g., 98XXXXXXXX"
                    className="w-full rounded-2xl border border-border-muted bg-white px-4 py-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-border-muted"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </InputShell>
              </div>

              {/* Images */}
              <div className="md:col-span-2">
                <FieldLabel>Upload Phone Images</FieldLabel>

                <div className="rounded-2xl border border-border-muted bg-surface-white-subtle p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-text-primary">
                      Add photos (optional). Clear pictures help us evaluate
                      faster.
                    </div>

                    <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-border-muted bg-white px-4 py-2 text-sm font-semibold text-text-primary shadow-sm hover:bg-surface-white-subtle">
                      Choose files
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImages}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {images.length > 0 ? (
                    <div className="mt-4">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {images.map((file, idx) => {
                          const url = URL.createObjectURL(file);
                          return (
                            <div
                              key={idx}
                              className="group relative aspect-square overflow-hidden rounded-xl border border-border-muted bg-white"
                            >
                              <img
                                src={url}
                                alt="Preview"
                                className="h-full w-full object-cover"
                                onLoad={() => URL.revokeObjectURL(url)}
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-text-primary shadow-sm hover:bg-white"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 text-xs text-text-muted">
                        Selected:{" "}
                        <span className="font-semibold text-text-primary">
                          {images.length}
                        </span>{" "}
                        file{images.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-text-muted">
                      No files selected.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-7">
              <button
                type="submit"
                disabled={submitting || booting || !user}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-primary-blue px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60 active:scale-[0.99]"
              >
                {submitting
                  ? "Submitting..."
                  : form.requestType === "sell"
                  ? "Submit Sell Request"
                  : "Submit Exchange Request"}
              </button>

              {message ? (
                <div className="mt-4 rounded-2xl border border-border-muted bg-surface-white-subtle px-4 py-3 text-center text-sm font-semibold text-text-primary">
                  {message}
                </div>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
