import mongoose from "mongoose";
import slugify from "slugify";

const ALLOWED_CONDITIONS = ["new", "like_new", "pre_owned", "refurbished"];
const ALLOWED_AVAILABILITY = ["in_stock", "out_of_stock", "coming_soon"];

const deviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    brand: {
      type: String,
      trim: true,
      index: true,
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    feature: {
      type: String,
      default: "",
    },

    condition: {
      type: String,
      enum: ALLOWED_CONDITIONS,
      required: true,
      default: "new",
      index: true,
    },

    availability: {
      type: String,
      enum: ALLOWED_AVAILABILITY,
      default: "in_stock",
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    images: [
      {
        type: String, // stored URLs
        validate: {
          validator: (v) => /^https?:\/\//.test(v) || v.startsWith("/uploads/"),
          message: (props) => `${props.value} is not a valid image URL`,
        },
      },
    ],

    thumbnail: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

/**
 * Normalize fields and generate a UNIQUE URL-friendly slug
 * - Normalizes condition/availability
 * - Ensures slug uniqueness (prevents duplicate key errors when names repeat)
 */
deviceSchema.pre("validate", async function () {
  // Normalize condition and availability
  if (this.condition) {
    this.condition = String(this.condition).toLowerCase().replace(/\s|-/g, "_");
  }
  if (this.availability) {
    this.availability = String(this.availability)
      .toLowerCase()
      .replace(/\s|-/g, "_");
  }

  // ✅ Auto-sync availability with quantity
  if (this.quantity === 0) {
    this.availability = "out_of_stock";
  } else if (this.quantity > 0 && this.availability === "out_of_stock") {
    this.availability = "in_stock";
  }

  // Generate slug if missing
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }

  // Ensure slug is unique (when creating OR when slug changed)
  if (this.slug && (this.isNew || this.isModified("slug"))) {
    const base = this.slug;
    let candidate = base;
    let i = 0;

    while (
      await this.constructor.exists({ slug: candidate, _id: { $ne: this._id } })
    ) {
      i += 1;
      candidate = `${base}-${i}`;
      if (i > 500) break;
    }

    this.slug = candidate;
  }
});


deviceSchema.index(
  { name: "text", brand: "text", feature: "text", description: "text" },
  {
    name: "DeviceTextIndex",
    weights: { name: 10, brand: 6, feature: 4, description: 1 },
  }
);

deviceSchema.index({ featured: 1, createdAt: -1 });
deviceSchema.index({ brand: 1, price: 1 });
deviceSchema.index({ condition: 1, availability: 1, price: 1, createdAt: -1 });
deviceSchema.index({ createdAt: -1 });

export default mongoose.model("Device", deviceSchema);
