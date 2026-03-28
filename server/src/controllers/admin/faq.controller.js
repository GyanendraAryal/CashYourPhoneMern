import mongoose from "mongoose";
import Faq from "../../models/Faq.js";

function cleanText(v = "") {
  return String(v).replace(/\s+/g, " ").trim();
}

export async function list(req, res, next) {
  try {
    const { q = "", category = "" } = req.query;

    const filter = {};
    if (q) {
      filter.$or = [
        { question: { $regex: q, $options: "i" } },
        { answer: { $regex: q, $options: "i" } },
      ];
    }
    if (category) filter.category = category;

    const items = await Faq.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const question = cleanText(req.body?.question);
    const answer = cleanText(req.body?.answer);
    const category = cleanText(req.body?.category || "");
    const isActive = req.body?.isActive === false || req.body?.isActive === "false" ? false : true;

    if (!question || !answer) {
      res.status(400);
      throw new Error("question and answer are required");
    }

    // auto-order at end
    const maxOrderDoc = await Faq.findOne({}).sort({ order: -1 }).select("order").lean();
    const nextOrder = (maxOrderDoc?.order ?? -1) + 1;

    const doc = await Faq.create({ question, answer, category, isActive, order: nextOrder });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;

    const data = {};
    if (req.body.question !== undefined) data.question = cleanText(req.body.question);
    if (req.body.answer !== undefined) data.answer = cleanText(req.body.answer);
    if (req.body.category !== undefined) data.category = cleanText(req.body.category);
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive === true || req.body.isActive === "true";

    const updated = await Faq.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      res.status(404);
      throw new Error("FAQ not found");
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const deleted = await Faq.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404);
      throw new Error("FAQ not found");
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/**
 * Body: { orderedIds: ["id1","id2", ...] }
 * Updates order = index for each id
 */
export async function reorder(req, res, next) {
  try {
    const orderedIds = req.body?.orderedIds;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      res.status(400);
      throw new Error("orderedIds[] is required");
    }

    const ops = orderedIds.map((id, idx) => {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      return {
        updateOne: {
          filter: { _id: id },
          update: { $set: { order: idx } },
        },
      };
    }).filter(Boolean);

    await Faq.bulkWrite(ops);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
