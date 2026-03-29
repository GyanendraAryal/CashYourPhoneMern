import HeroSlide from "../models/HeroSlide.js";
import { toPublicUploadUrl } from "../utils/upload.js";
import { normalizeImageField } from "../utils/normalizeImage.js";

/**
 * 🛡️ Safe image resolver (protects against bad DB values)
 */
function safeImage(req, value) {
  if (!value || typeof value !== "string") return "";

  // prevent corrupted values
  if (value.includes("[object Object]")) return "";

  return toPublicUploadUrl(req, value);
}

/**
 * 📥 GET /hero
 * Public endpoint
 */
export async function listHeroSlides(req, res, next) {
  try {
    const slides = await HeroSlide.find({ active: true }).sort({
      order: 1,
      createdAt: -1,
    });

    const mapped = slides.map((slide) => {
      const imageUrl = safeImage(req, slide.image);

      const imageDesktopUrl = slide.imageDesktop
        ? safeImage(req, slide.imageDesktop)
        : imageUrl;

      const imageMobileUrl = slide.imageMobile
        ? safeImage(req, slide.imageMobile)
        : "";

      return {
        _id: slide._id,
        title: slide.title,
        subtitle: slide.subtitle,
        order: slide.order,
        active: slide.active,

        imageUrl,
        imageDesktopUrl,
        imageMobileUrl,
      };
    });

    res.json({ slides: mapped });
  } catch (err) {
    next(err);
  }
}

/**
 * 📥 POST /hero
 * Create new slide
 */
export async function createHeroSlide(req, res, next) {
  try {
    const slide = new HeroSlide({
      title: req.body.title,
      subtitle: req.body.subtitle,
      order: req.body.order || 0,
      active: req.body.active ?? true,

      // ✅ normalize BEFORE saving
      image: normalizeImageField(req.body.image),
      imageDesktop: normalizeImageField(req.body.imageDesktop),
      imageMobile: normalizeImageField(req.body.imageMobile),
    });

    await slide.save();

    res.status(201).json({ slide });
  } catch (err) {
    next(err);
  }
}

/**
 * 📥 PUT /hero/:id
 * Update slide
 */
export async function updateHeroSlide(req, res, next) {
  try {
    const slide = await HeroSlide.findById(req.params.id);

    if (!slide) {
      return res.status(404).json({ message: "Slide not found" });
    }

    slide.title = req.body.title ?? slide.title;
    slide.subtitle = req.body.subtitle ?? slide.subtitle;
    slide.order = req.body.order ?? slide.order;
    slide.active = req.body.active ?? slide.active;

    // ✅ only update if provided
    if (req.body.image !== undefined) {
      slide.image = normalizeImageField(req.body.image);
    }

    if (req.body.imageDesktop !== undefined) {
      slide.imageDesktop = normalizeImageField(req.body.imageDesktop);
    }

    if (req.body.imageMobile !== undefined) {
      slide.imageMobile = normalizeImageField(req.body.imageMobile);
    }

    await slide.save();

    res.json({ slide });
  } catch (err) {
    next(err);
  }
}

/**
 * 📥 DELETE /hero/:id
 */
export async function deleteHeroSlide(req, res, next) {
  try {
    const slide = await HeroSlide.findByIdAndDelete(req.params.id);

    if (!slide) {
      return res.status(404).json({ message: "Slide not found" });
    }

    res.json({ message: "Slide deleted successfully" });
  } catch (err) {
    next(err);
  }
}