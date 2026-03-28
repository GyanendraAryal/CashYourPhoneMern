import React, { useEffect, useState } from "react";
import { createReview, getReviews } from "../services/reviewService";
import { normalizeReview } from "../utils/normalize";

const placeholderAvatar = "/icons/user-placeholder.svg";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rating: 5,
    content: "",
    avatar: null,
  });

  const fetchReviews = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getReviews({ limit: 100 });
      const list = Array.isArray(res.data?.reviews)
        ? res.data.reviews
        : Array.isArray(res.data)
          ? res.data
          : [];

      setReviews(list.map(normalizeReview));
    } catch (err) {
      console.warn("Failed to fetch reviews:", err);
      setError("Could not load reviews.");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar") {
      setFormData((p) => ({ ...p, avatar: files?.[0] || null }));
      return;
    }
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      let payload = null;

      if (formData.avatar) {
        payload = new FormData();
        payload.append("name", formData.name);
        payload.append("email", formData.email);
        payload.append("rating", String(formData.rating));
        payload.append("content", formData.content);
        payload.append("avatar", formData.avatar);
      } else {
        payload = {
          name: formData.name,
          email: formData.email,
          rating: Number(formData.rating),
          content: formData.content,
        };
      }

      await createReview(payload);

      setSuccess("✅ Thanks! Your review was submitted and is pending approval.");
      setFormData({ name: "", email: "", rating: 5, content: "", avatar: null });
      await fetchReviews();
    } catch (err) {
      console.warn("Create review failed:", err);
      setError(err?.response?.data?.message || "❌ Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-white-subtle to-white">
      <div className="container mx-auto py-16 px-4 md:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--brand-dark)]">
            Customer Reviews
          </h1>
          <p className="mt-3 text-text-muted text-base md:text-lg">
            Read what customers say — and add your own review.
          </p>
        </div>

        {/* STACKED LAYOUT: Form on top, Reviews below */}
        <div className="mt-12 space-y-10">
          {/* Form */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/90 backdrop-blur border border-border-muted rounded-3xl shadow-sm p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Add a Review</h2>
                <span className="text-xs px-3 py-1 rounded-full bg-surface-white-subtle text-text-muted">
                  Takes ~30s
                </span>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-text-primary">
                      Name
                    </label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your Name"
                      className="mt-1 w-full p-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-[var(--brand-dark)]/30"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-primary">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email (optional)"
                      className="mt-1 w-full p-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-[var(--brand-dark)]/30"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-text-primary">
                      Rating
                    </label>
                    <select
                      name="rating"
                      value={formData.rating}
                      onChange={handleChange}
                      className="mt-1 w-full p-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-[var(--brand-dark)]/30"
                    >
                      {[5, 4, 3, 2, 1].map((r) => (
                        <option key={r} value={r}>
                          {r} Star{r > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-primary">
                      Avatar
                    </label>
                    <input
                      name="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleChange}
                      className="mt-1 w-full p-[10px] border rounded-xl bg-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-text-primary">
                    Review
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="Write your review..."
                    className="mt-1 w-full p-3 border rounded-xl min-h-[140px] outline-none focus:ring-2 focus:ring-[var(--brand-dark)]/30"
                    required
                  />
                </div>

                <button
                  disabled={submitting}
                  className="mt-2 w-full bg-[var(--brand-dark)] text-white py-3.5 rounded-xl font-semibold hover:opacity-95 active:scale-[0.99] transition disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>

                {error && (
                  <div className="rounded-xl border border-primary-blue-muted bg-primary-blue-muted p-3 text-primary-blue-active text-sm font-medium">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-xl border border-success-green-muted bg-success-green-muted p-3 text-success-green-dark text-sm font-medium">
                    {success}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Reviews */}
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">All Reviews</h2>
              </div>
            </div>

            {loading ? (
              <div className="text-text-muted">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-text-muted">No reviews yet.</div>
            ) : (
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="group bg-white border border-border-muted rounded-3xl shadow-smtransition-all duration-300 ease-outhover:shadow-lg 
                    hover:-translate-y-1 hover:scale-[1.03]overflow-hidden lg:min-h-[280px]"

                  >
                    {/* Top stripe */}
                    <div className="h-2 bg-[var(--brand-dark)]/90" />

                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <img
                          src={r.avatarUrl || placeholderAvatar}
                          alt={r.name}
                          className="w-12 h-12 rounded-2xl object-cover border bg-surface-white-subtle"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-text-primary truncate">
                            {r.name}
                          </p>
                          {r.createdAt && (
                            <p className="text-xs text-text-muted mt-0.5">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm font-semibold">
                          <span className="text-primary-blue-active">
                            {"★".repeat(Math.max(1, Math.min(5, r.rating)))}
                          </span>
                          <span className="text-text-muted font-medium">
                            {" "}
                            ({Math.max(1, Math.min(5, r.rating))}/5)
                          </span>
                        </div>


                        <span className="text-xs px-2.5 py-1 rounded-full bg-surface-white-subtle text-text-muted">
                          Verified
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-text-primary leading-relaxed line-clamp-4">
                        {r.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
