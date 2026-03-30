import HeroSlide from "../../models/HeroSlide.js";
import { isCloudinaryMode, toPublicUploadUrl, uploadToCloudinary } from "../../utils/upload.js";
import mongoose from "mongoose";

function pickFile(req, field) {
  const f = req?.files?.[field];
  return Array.isArray(f) && f.length ? f[0] : null;
}

/**
 * Helper to ensure we use the URL provided by the middleware if available,
 * otherwise fall back to what was already in the document (for updates).
 */
function getFinalUrl(req, field, fallback = "") {
  // middleware puts strings or arrays of strings in req.body[field]
  const val = req.body[field];
  
  if (typeof val === "string" && val.length > 0) {
    if (val.includes("[object Object]")) {
      console.warn(`[HERO] Detected corruption in ${field}, falling back to original.`);
      return fallback;
    }
    return val;
  }
  
  if (Array.isArray(val) && val.length > 0) {
    if (typeof val[0] === "string" && !val[0].includes("[object Object]")) {
      return val[0];
    }
  }

  return fallback;
}

/**
 * Public list — homepage
 * Returns { data: [slides] } to match client expectation
 */
export const list = async (req, res, next) => {
  try {
    const items = await HeroSlide.find({ active: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    
    // Normalize properties for client (imageDesktop -> imageDesktopUrl etc)
    const mapped = items.map(it => {
      const imageUrl = toPublicUploadUrl(req, it.image);
      const imageDesktopUrl = toPublicUploadUrl(req, it.imageDesktop || it.image);
      const imageMobileUrl = toPublicUploadUrl(req, it.imageMobile || "");

      return {
        ...it,
        imageUrl,
        imageDesktopUrl,
        imageMobileUrl
      };
    });

    // ✅ FIX: HeroSlider.jsx expects res.data.data
    res.json({ data: mapped });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin list — all slides
 */
export const listAdmin = async (req, res, next) => {
  try {
    const items = await HeroSlide.find({})
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // ✅ Ensure absolute URLs for Admin panel too
    const mapped = items.map(it => ({
      ...it,
      image: toPublicUploadUrl(req, it.image),
      imageDesktop: toPublicUploadUrl(req, it.imageDesktop || it.image),
      imageMobile: toPublicUploadUrl(req, it.imageMobile || "")
    }));

    res.json(mapped);
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const item = await HeroSlide.findById(id);
    if (!item) {
      res.status(404);
      throw new Error("Hero slide not found");
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { title, subtitle, ctaText, ctaLink, order, active } = req.body;
    
    // 🔥 Use URLs already processed by the 'upload' middleware
    const imageDesktop = getFinalUrl(req, "imageDesktop") || getFinalUrl(req, "image");
    const imageMobile = getFinalUrl(req, "imageMobile");

    if (!imageDesktop) {
      res.status(400);
      throw new Error("Desktop image is required (field: imageDesktop)");
    }

    // Keep legacy field populated so older clients still work.
    const image = imageDesktop;

    const created = await HeroSlide.create({
      title: title || "",
      subtitle: subtitle || "",
      ctaText: ctaText || "Sell Now",
      ctaLink: ctaLink || "/sell",
      order: order ? Number(order) : 0,
      active: active === undefined ? true : (active === true || active === "true"),
      image,
      imageDesktop,
      imageMobile,
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const slide = await HeroSlide.findById(id);
    if (!slide) {
      res.status(404);
      throw new Error("Hero slide not found");
    }

    const { title, subtitle, ctaText, ctaLink, order, active } = req.body;

    if (title !== undefined) slide.title = title;
    if (subtitle !== undefined) slide.subtitle = subtitle;
    if (ctaText !== undefined) slide.ctaText = ctaText;
    if (ctaLink !== undefined) slide.ctaLink = ctaLink;
    if (order !== undefined) slide.order = Number(order);
    if (active !== undefined) slide.active = active === true || active === "true";

    // 🔥 Update URLs from middleware if new files were sent
    const newDesktop = getFinalUrl(req, "imageDesktop") || getFinalUrl(req, "image");
    const newMobile = getFinalUrl(req, "imageMobile");

    if (newDesktop) {
      slide.imageDesktop = newDesktop;
      slide.image = newDesktop; // Keep legacy in sync
    }

    if (newMobile) {
      slide.imageMobile = newMobile;
    }

    await slide.save();
    res.json(slide);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const slide = await HeroSlide.findById(id);
    if (!slide) {
      res.status(404);
      throw new Error("Hero slide not found");
    }

    await slide.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
