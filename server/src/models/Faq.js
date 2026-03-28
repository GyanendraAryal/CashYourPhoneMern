import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 200 },
    answer: { type: String, required: true, trim: true, maxlength: 2000 },
    category: { type: String, trim: true, default: "", maxlength: 60 },

    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

faqSchema.index({ isActive: 1, order: 1 });

export default mongoose.model("Faq", faqSchema);
