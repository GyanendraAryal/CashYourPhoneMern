import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { createProductReview, listProductReviews } from "../services/productReviewService";

function StarRow({ value = 0 }) {
  const v = Math.round(Number(value) || 0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < v ? "text-yellow-500" : "text-gray-300"}>★</span>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await listProductReviews({ productId, status: "approved" });
      setItems(res?.items || []);
    } catch (e) {
      // non-blocking
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!productId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const avg = useMemo(() => {
    if (!items.length) return 0;
    const s = items.reduce((a, x) => a + (Number(x.rating) || 0), 0);
    return s / items.length;
  }, [items]);

  async function submit(e) {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to submit a review.");
      return;
    }
    const t = title.trim();
    const c = comment.trim();
    if (!t || !c) {
      toast.error("Title and comment are required.");
      return;
    }

    setSubmitting(true);
    try {
      await createProductReview({ productId, rating, title: t, comment: c });
      setTitle("");
      setComment("");
      setRating(5);
      toast.success("Review submitted for approval.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">Reviews</div>
          <div className="text-sm text-gray-600">
            {items.length ? (
              <span className="inline-flex items-center gap-2">
                <StarRow value={avg} />
                <span>{avg.toFixed(1)} / 5</span>
                <span className="text-gray-400">•</span>
                <span>{items.length} review{items.length === 1 ? "" : "s"}</span>
              </span>
            ) : (
              "No reviews yet."
            )}
          </div>
        </div>

        <button
          onClick={load}
          className="px-3 py-2 rounded-lg text-sm border bg-white hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border rounded-2xl p-4">
          <div className="text-sm font-semibold mb-2">Write a review</div>
          {!user ? (
            <div className="text-sm text-gray-600">
              Please login to submit a review. Your review will appear after admin approval.
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} Star{n === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Short summary"
                  maxLength={80}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm min-h-[110px]"
                  placeholder="What did you like?"
                  maxLength={1200}
                />
              </div>
              <button
                disabled={submitting}
                className="w-full rounded-lg px-4 py-2 text-sm font-medium bg-primary-blue-active text-white hover:opacity-95 disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit (Pending approval)"}
              </button>
            </form>
          )}
        </div>

        <div className="bg-white border rounded-2xl p-4">
          <div className="text-sm font-semibold mb-2">Approved reviews</div>

          {loading ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-gray-500">No approved reviews yet.</div>
          ) : (
            <ul className="space-y-3">
              {items.map((r) => (
                <li key={r._id} className="border rounded-xl p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{r.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {r.userId?.name || "User"}
                      </div>
                    </div>
                    <StarRow value={r.rating} />
                  </div>
                  <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">
                    {r.comment}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
