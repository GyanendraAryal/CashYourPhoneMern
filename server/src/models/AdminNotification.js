import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    entityModel: { type: String, required: true, trim: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    message: { type: String, required: true, trim: true, maxlength: 240 },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Prevent duplicate notifications for same entity (idempotent)
adminNotificationSchema.index({ type: 1, entityId: 1 }, { unique: true });

export default mongoose.model("AdminNotification", adminNotificationSchema);
