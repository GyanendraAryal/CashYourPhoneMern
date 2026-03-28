import HeroSlide from "../models/HeroSlide.js";
import { toPublicUploadUrl } from "../utils/upload.js";

export async function listHeroSlides(req, res, next) {
  try {
    const slides = await HeroSlide.find({ active: true }).sort({
      order: 1,
      createdAt: -1,
    });

    const mapped = slides.map((slide) => {
      const legacy = String(slide.image || "").trim();
      const desktop = String(slide.imageDesktop || "").trim();
      const mobile = String(slide.imageMobile || "").trim();

      const imageUrl = legacy ? toPublicUploadUrl(req, legacy) : null;
      const imageDesktopUrl = desktop ? toPublicUploadUrl(req, desktop) : imageUrl;
      const imageMobileUrl = mobile ? toPublicUploadUrl(req, mobile) : null;

      return {
        ...slide.toObject(),
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
