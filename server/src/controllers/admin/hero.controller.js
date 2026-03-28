import HeroSlide from "../../models/HeroSlide.js";
import { isCloudinaryMode, toPublicUploadUrl, uploadToCloudinary } from "../../utils/upload.js";
import mongoose from "mongoose";

function pickFile(req, field) {
  const f = req?.files?.[field];
  return Array.isArray(f) && f.length ? f[0] : null;
}

async function toUrl(req, multerFile) {
  if (!multerFile) return "";
  return isCloudinaryMode()
    ? await uploadToCloudinary(multerFile, { folder: "hero" })
    : toPublicUploadUrl(req, multerFile);
}

/**
 * Public list — homepage
 */
export const list = async (req, res, next) => {
  try {
    const items = await HeroSlide.find({ active: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    res.json(items);
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
    res.json(items);
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
    const desktopFile = pickFile(req, "imageDesktop") || pickFile(req, "image");
    const mobileFile = pickFile(req, "imageMobile");

    if (!desktopFile) {
      res.status(400);
      throw new Error("Desktop image is required (field: imageDesktop)");
    }

    const { title, subtitle, ctaText, ctaLink, order, active } = req.body;

    const imageDesktop = await toUrl(req, desktopFile);
    const imageMobile = mobileFile ? await toUrl(req, mobileFile) : "";

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

    const desktopFile = pickFile(req, "imageDesktop") || pickFile(req, "image");
    const mobileFile = pickFile(req, "imageMobile");

    if (desktopFile) {
      slide.imageDesktop = await toUrl(req, desktopFile);
      // Keep legacy in sync (older clients)
      slide.image = slide.imageDesktop;
    }

    if (mobileFile) {
      slide.imageMobile = await toUrl(req, mobileFile);
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
