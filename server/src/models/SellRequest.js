import mongoose from "mongoose";

const CONDITION_ENUM = ["new", "like_new", "refurbished", "pre_owned"];
const STATUS_ENUM = ["CREATED", "PAYMENT_PENDING", "PAID", "VERIFIED", "COMPLETED", "REJECTED"];

const sellRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    isGuest: { type: Boolean, default: true, index: true },


    fullName: { type: String, required: true, trim: true, minlength: 2 },

    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+?[0-9]{7,15}$/, "Invalid phone number format"],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Invalid email address"],
    },

    deviceName: { type: String, required: true, trim: true },

    deviceCondition: {
      type: String,
      enum: CONDITION_ENUM,
      default: "new",
      lowercase: true,
      required: true,
    },

    expectedPrice: { type: Number, default: 0, min: 0 },
    suggestedPrice: { type: Number, default: 0 }, // rule-based or final suggested
    mlPrice: { type: Number, default: 0 },        // pure ML output
    mlConfidence: { type: Number, default: 0 },   // 0 to 1

    notes: { type: String, default: "", trim: true, maxlength: 500 },

    images: [
      {
        type: String,
        validate: {
          validator: (v) => /^https?:\/\//.test(v) || v.startsWith("/uploads/"),
          message: (props) => `${props.value} is not a valid image URL`,
        },
      },
    ],

    status: { type: String, enum: STATUS_ENUM, default: "CREATED", index: true },

    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

sellRequestSchema.index({ isDeleted: 1, status: 1, createdAt: -1 });

sellRequestSchema.pre("validate", function (next) {
  if (this.isGuest === false && !this.userId) {
    this.invalidate("userId", "userId is required for non-guest requests");
  }
  next();
});


export default mongoose.model("SellRequest", sellRequestSchema);
