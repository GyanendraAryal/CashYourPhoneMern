import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    provider: { type: String, enum: ["khalti", "esewa", "bank"], required: true },

    // Provider identifiers (eSewa uses payment._id as transaction_uuid in our flow)
    transactionUuid: { type: String, default: "" },
    esewaRefId: { type: String, default: "" },

    amount: { type: Number, required: true },
    currency: { type: String, default: "NPR" },

    status: {
      type: String,
      enum: ["initiated", "succeeded", "failed", "cancelled"],
      default: "initiated",
    },

    // Store sanitized callback payloads for debugging (do NOT store secrets)
    rawCallback: { type: Object, default: null },
    attempts: { type: Number, default: 0 },
    lastCheckedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },

    reference: String,
  },
  { timestamps: true }
);

// Indexes for performance + integrity
PaymentSchema.index({ order: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ transactionUuid: 1 });

// ✅ Only one succeeded payment per order
PaymentSchema.index(
  { order: 1 },
  { unique: true, partialFilterExpression: { status: "succeeded" } }
);

export default mongoose.model("Payment", PaymentSchema);
