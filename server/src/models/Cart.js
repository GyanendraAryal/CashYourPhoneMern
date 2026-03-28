import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },

    // Variants (optional): used for dedupe + merge + correctness
    variant: {
      storage: { type: String, default: "" },
      color: { type: String, default: "" },
      condition: { type: String, default: "" },
    },

    qty: { type: Number, required: true, min: 1, max: 5, default: 1 },
    priceSnapshot: { type: Number, required: true, default: 0 },
  },
  {
    // ✅ allow cart line item ids (needed for PATCH/DELETE /cart/items/:id)
    _id: true,
  }
);

const CartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
    items: { type: [CartItemSchema], default: [] },

    // Unread tracking
    lastUpdatedAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: () => new Date(0) },
  },
  { timestamps: true }
);

export default mongoose.model("Cart", CartSchema);
