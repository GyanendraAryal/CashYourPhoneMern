import Faq from "../models/Faq.js";

export async function listActiveFaqs(req, res, next) {
  try {
    const faqs = await Faq.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    res.json({ faqs });
  } catch (err) {
    next(err);
  }
}
