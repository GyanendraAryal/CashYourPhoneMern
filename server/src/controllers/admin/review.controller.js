import Review from "../../models/Review.js";
import { isCloudinaryMode, toPublicUploadUrl, uploadToCloudinary } from "../../utils/upload.js";
import mongoose from "mongoose";

export async function list(req, res, next) {
  try {
    const qStatus = String(req.query.status || "").toLowerCase().trim();
    const qActiveRaw = String(req.query.active ?? "").toLowerCase().trim();
    const hasActive =
      qActiveRaw === "true" || qActiveRaw === "false" || qActiveRaw === "1" || qActiveRaw === "0";

    const filter = {};

    // Prefer status-based moderation; keep backward-compat for legacy docs
    if (qStatus === "pending" || qStatus === "approved" || qStatus === "rejected") {
      filter.$or = [
        { status: qStatus },
        // legacy fallback (no status yet)
        ...(qStatus === "approved"
          ? [{ status: { $exists: false }, $or: [{ active: true }, { active: { $exists: false } }] }]
          : qStatus === "pending"
          ? [{ status: { $exists: false }, active: false }]
          : []),
      ];
    } else if (hasActive) {
      const wantActive = qActiveRaw === "true" || qActiveRaw === "1";
      filter.active = wantActive;
    }

    const reviews = await Review.find(filter).sort({ createdAt: -1 }).limit(500);

    const mapped = reviews.map((r) => {
      const obj = r.toObject();
      const derivedStatus = obj.status || (obj.active === false ? "pending" : "approved");
      return {
        ...obj,
        status: derivedStatus,
        avatar: r.avatar ? toPublicUploadUrl(req, r.avatar) : "",
      };
    });

    res.json({ reviews: mapped });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    res.json({
      review: {
        ...review.toObject(),
        avatar: review.avatar ? toPublicUploadUrl(req, review.avatar) : "",
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { name, rating, message, designation, active, status } = req.body;

    const cleanName = String(name || "").trim();
    const cleanMsg = String(message || "").trim();
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

    let avatar = "";
    if (req.file) {
      avatar = isCloudinaryMode()
        ? await uploadToCloudinary(req.file, { folder: "reviews" })
        : req.file.path.replace(/\\/g, "/");
    }

    const isActiveBool = typeof active === "boolean";

    const incomingStatus = String(status || "").toLowerCase().trim();
    const resolvedStatus =
      incomingStatus === "pending" || incomingStatus === "approved" || incomingStatus === "rejected"
        ? incomingStatus
        : isActiveBool
        ? active
          ? "approved"
          : "pending"
        : "approved";

    const resolvedActive = resolvedStatus === "approved";

    const review = await Review.create({
      name: cleanName,
      rating: numRating,
      message: cleanMsg,
      designation: cleanDesignation,
      avatar,
      status: resolvedStatus,
      active: resolvedActive,
    });

    res.status(201).json({
      review: {
        ...review.toObject(),
        avatar: review.avatar ? toPublicUploadUrl(req, review.avatar) : "",
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const { name, rating, message, designation, active, status } = req.body;

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (name !== undefined) {
      const clean = String(name).trim();
      if (!clean) return res.status(400).json({ message: "name is required" });
      if (clean.length > 80) {
        return res.status(400).json({ message: "name is too long (max 80 chars)" });
      }
      review.name = clean;
    }
    if (rating !== undefined) {
      const num = Number(rating);
      if (!Number.isFinite(num) || num < 1 || num > 5) {
        return res.status(400).json({ message: "rating must be 1 to 5" });
      }
      review.rating = num;
    }
    if (message !== undefined) {
      const clean = String(message).trim();
      if (clean.length > 1200) {
        return res.status(400).json({ message: "message is too long (max 1200 chars)" });
      }
      review.message = clean;
    }
    if (designation !== undefined) {
      const clean = String(designation).trim() || "Customer";
      if (clean.length > 60) {
        return res.status(400).json({ message: "designation is too long (max 60 chars)" });
      }
      review.designation = clean;
    }

    if (status !== undefined) {
      const s = String(status || "").toLowerCase().trim();
      if (s !== "pending" && s !== "approved" && s !== "rejected") {
        return res.status(400).json({ message: "status must be pending, approved, or rejected" });
      }
      review.status = s;
      review.active = s === "approved";
    } else if (active !== undefined) {
      const nextActive = active === true || active === "true" || active === 1 || active === "1";
      review.active = nextActive;
      review.status = nextActive ? "approved" : "pending";
    }

    if (req.file) {
      review.avatar = isCloudinaryMode()
        ? await uploadToCloudinary(req.file, { folder: "reviews" })
        : req.file.path.replace(/\\/g, "/");
    }

    await review.save();

    res.json({
      review: {
        ...review.toObject(),
        avatar: review.avatar ? toPublicUploadUrl(req, review.avatar) : "",
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const review = await Review.findByIdAndDelete(id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}