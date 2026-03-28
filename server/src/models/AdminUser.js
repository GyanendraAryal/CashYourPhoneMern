import mongoose from "mongoose";

const ROLE_ENUM = ["owner", "admin", "manager", "support", "fulfillment", "readonly"];

const adminUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },

    // Phase 3: Staff roles (RBAC)
    role: {
      type: String,
      enum: ROLE_ENUM,
      default: "admin",
      index: true,
    },
    disabled: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const ADMIN_ROLES = ROLE_ENUM;

export default mongoose.model("AdminUser", adminUserSchema);
