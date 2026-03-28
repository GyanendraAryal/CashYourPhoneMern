import ProductReview from "../models/ProductReview.js";
import Device from "../models/Device.js";
import { createAdminNotification } from "../services/adminNotification.service.js";

function normalizeStatus(v) {
  const s = String(v || "").toLowerCase().trim();
  if (["pending", "approved", "rejected"].includes(s)) return s;
  return null;
}

export async function createProductReview(req, res, next) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { productId, rating, title, comment } = req.body || {};

    const r = Number(rating);
    if (!Number.isFinite(r) || r < 1 || r > 5) {
      return res.status(400).json({ message: "rating must be 1-5" });
    }
    const t = String(title || "").trim();
    const c = String(comment || "").trim();

    if (!t || !c) return res.status(400).json({ message: "title and comment are required" });

    // If productId provided, ensure device exists
    let device = null;
    if (productId) {
      device = await Device.findById(productId).select("name").lean();
      if (!device) return res.status(404).json({ message: "Product not found" });
    }

    const doc = await ProductReview.create({
      userId,
      productId: productId || undefined,
      rating: r,
      title: t,
      comment: c,
      status: "pending",
    });

    // Notify admin (never fail request)
    await createAdminNotification({
      type: "NEW_PRODUCT_REVIEW",
      entityModel: "ProductReview",
      entityId: doc._id,
      message: `New review pending${device?.name ? `: ${device.name}` : ""}`,
    });

    res.status(201).json({ review: doc });
  } catch (err) {
    // Handle unique constraint (one per user per product)
    if (err?.code === 11000) {
      return res.status(409).json({ message: "You already reviewed this product." });
    }
    next(err);
  }
}

export async function listProductReviews(req, res, next) {
  try {
    const status = normalizeStatus(req.query.status) || "approved";
    const productId = req.query.productId ? String(req.query.productId) : null;

    const filter = { status };
    if (productId) filter.productId = productId;

    const items = await ProductReview.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name")
      .lean();

    res.json({ items });
  } catch (err) {
    next(err);
  }
}
