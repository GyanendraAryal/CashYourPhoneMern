import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    designation: { type: String, default: "Customer", trim: true, maxlength: 60 },
    rating: { type: Number, min: 1, max: 5, required: true },
    message: { type: String, required: true, trim: true, maxlength: 1200 },

    // Store relative upload path in DB: "/uploads/xxx.jpg" (recommended)
    // API will convert to full public URL when returning to admin UI
    avatar: { type: String, default: "" },

    // Moderation status (do NOT auto-publish new reviews)
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    // Backward-compat flag used by existing UI/APIs
    // - approved  => active=true
    // - pending/rejected => active=false
    active: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Helpful indexes for public lists + admin moderation
reviewSchema.index({ status: 1, active: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);
