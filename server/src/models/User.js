import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, minlength: 2, maxlength: 60 },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // allows users without email if you use phone-only
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      unique: true,
      index: true,
      required: true
    },

    passwordHash: { type: String, required: true },

    role: { type: String, enum: ["user", "admin", "staff"], default: "user", index: true },

    isVerified: { type: Boolean, default: false },

    // refresh token rotation storage (recommended)
    refreshTokens: [
      {
        tokenHash: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true },
        lastUsedAt: { type: Date },
        revokedAt: { type: Date },
        userAgent: { type: String },
        ip: { type: String },
      },
    ],

    // Password reset fields
    passwordResetTokenHash: { type: String, default: null },
    passwordResetTokenExpiresAt: { type: Date, default: null },

    passwordResetOtpHash: { type: String, default: null },
    passwordResetOtpExpiresAt: { type: Date, default: null },
    passwordResetOtpAttempts: { type: Number, default: 0 },

  },
  { timestamps: true }
);

// Optional: ensure at least one identifier exists
userSchema.pre("validate", function (next) {
  if (!this.phone) {
    return next(new Error("Phone is required."));
  }
  next();
});

export default mongoose.model("User", userSchema);
