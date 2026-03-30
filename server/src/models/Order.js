import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },

    // snapshots (store what user saw at checkout)
    name: { type: String, default: "" },
    condition: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    thumbnail: { type: String, default: "" },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    contact: {
      fullName: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" },
    },

    items: { type: [OrderItemSchema], default: [] },

    currency: { type: String, default: "NPR" },

    total: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: ["created", "processing", "shipped", "completed", "cancelled"],
      default: "created",
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
      index: true,
    },
  },
  { timestamps: true }
);

// Performance Indexes
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", OrderSchema);
