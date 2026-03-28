import mongoose from "mongoose";

const productReviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // In this project, products are Devices. Optional per requirement.
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: false },

    rating: { type: Number, min: 1, max: 5, required: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    comment: { type: String, required: true, trim: true, maxlength: 1200 },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Optional anti-spam: one review per user per product (when productId exists)
productReviewSchema.index(
  { userId: 1, productId: 1 },
  { unique: true, partialFilterExpression: { productId: { $type: "objectId" } } }
);

export default mongoose.model("ProductReview", productReviewSchema);
