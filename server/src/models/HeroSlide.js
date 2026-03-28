import mongoose from "mongoose";

const heroSlideSchema = new mongoose.Schema(
  {
    // Title is optional in the admin CMS UI
    title: { type: String, trim: true, default: "" },
    subtitle: { type: String, default: "" },
    ctaText: { type: String, default: "Sell Now" },
    ctaLink: { type: String, default: "/sell" },

    /**
     * Legacy single-image field.
     * Keep for backward compatibility with existing slides and older clients.
     * We set this to the desktop image when available.
     */
    image: { type: String, required: true }, // URL

    /**
     * Responsive images
     * - imageDesktop: used on md+ screens
     * - imageMobile: used on small screens
     */
    imageDesktop: { type: String, default: "" }, // URL
    imageMobile: { type: String, default: "" }, // URL

    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Helpful indexes for homepage ordering
heroSlideSchema.index({ active: 1, order: 1 });

export default mongoose.model("HeroSlide", heroSlideSchema);
