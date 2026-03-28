import ProductReview from "../../models/ProductReview.js";

function normalizeStatus(v) {
  const s = String(v || "").toLowerCase().trim();
  if (["pending", "approved", "rejected"].includes(s)) return s;
  return null;
}

export async function listAdminProductReviews(req, res, next) {
  try {
    const status = normalizeStatus(req.query.status) || "pending";

    const items = await ProductReview.find({ status })
      .sort({ createdAt: -1 })
      .populate("userId", "name email phone")
      .populate("productId", "name brand")
      .lean();

    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function patchAdminProductReview(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const s = normalizeStatus(status);
    if (!s) return res.status(400).json({ message: "status must be pending|approved|rejected" });

    const update = { status: s };
    if (s === "approved") {
      update.approvedBy = req.admin?.sub || null;
      update.approvedAt = new Date();
    } else {
      update.approvedBy = null;
      update.approvedAt = null;
    }

    const doc = await ProductReview.findByIdAndUpdate(id, { $set: update }, { new: true })
      .populate("userId", "name email phone")
      .populate("productId", "name brand")
      .lean();

    if (!doc) return res.status(404).json({ message: "Review not found" });

    res.json({ item: doc });
  } catch (err) {
    next(err);
  }
}
