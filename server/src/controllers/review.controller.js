import Review from "../models/Review.js";
import { createAdminNotification } from "../services/adminNotification.service.js";
import { isCloudinaryMode, toPublicUploadUrl, uploadToCloudinary } from "../utils/upload.js";

function toStoredUploadPath(filePathOrUrl) {
  if (!filePathOrUrl) return "";
  const str = String(filePathOrUrl);

  // Remote URL (Cloudinary) stored as-is
  if (/^https?:\/\//i.test(str)) return str;

  const normalized = str.replace(/\\/g, "/");
  if (normalized.startsWith("uploads/")) return `/${normalized}`;

  const idx = normalized.lastIndexOf("/uploads/");
  if (idx !== -1) return normalized.slice(idx);

  if (normalized.startsWith("/uploads/")) return normalized;

  return normalized;
}

export async function listReviews(req, res, next) {
  try {
    const reviews = await Review.find({
      $or: [
        { status: "approved" },
        // Backward-compat for legacy docs (no status field yet)
        {
          status: { $exists: false },
          $or: [{ active: true }, { active: { $exists: false } }],
        },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(200);

    const mapped = reviews.map((r) => ({
      ...r.toObject(),
      avatar: r.avatar ? toPublicUploadUrl(req, r.avatar) : "",
    }));

    res.json({ reviews: mapped });
  } catch (err) {
    next(err);
  }
}

export async function createReview(req, res, next) {
  try {
    const { name, rating, message, content, designation } = req.body;
    const finalMessage = message || content;

    const cleanName = String(name || "").trim();
    const cleanMsg = String(finalMessage || "").trim();
    const cleanDesignation = String(designation || "Customer").trim() || "Customer";

    if (!cleanName || !rating || !cleanMsg) {
      return res.status(400).json({ message: "name, rating, message are required" });
    }

    if (cleanName.length > 80) {
      return res.status(400).json({ message: "name is too long (max 80 chars)" });
    }

    if (cleanDesignation.length > 60) {
      return res.status(400).json({ message: "designation is too long (max 60 chars)" });
    }

    if (cleanMsg.length > 1200) {
      return res.status(400).json({ message: "message is too long (max 1200 chars)" });
    }

    const numRating = Number(rating);
    if (!Number.isFinite(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: "rating must be 1 to 5" });
    }
let storedAvatar = "";
    if (req.file) {
      if (isCloudinaryMode()) {
        storedAvatar = await uploadToCloudinary(req.file, { folder: "reviews" });
      } else {
        storedAvatar = toStoredUploadPath(req.file.path);
      }
    }

    const review = await Review.create({
      name: String(name).trim(),
      rating: numRating,
      message: String(finalMessage).trim(),
      avatar: storedAvatar,
    });

    const out = {
      ...review.toObject(),
      avatar: storedAvatar ? toPublicUploadUrl(req, storedAvatar) : "",
    };

    res.status(201).json({ review: out });
  } catch (err) {
    next(err);
  }
}
