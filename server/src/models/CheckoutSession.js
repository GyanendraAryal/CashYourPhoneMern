import mongoose from "mongoose";

const CheckoutSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contact: {
      fullName: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" },
    },
    items: { type: Array, default: [] },
    total: { type: Number, required: true },
    currency: { type: String, default: "NPR" },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// TTL index to automatically delete abandoned sessions after 24 hours
CheckoutSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model("CheckoutSession", CheckoutSessionSchema);
