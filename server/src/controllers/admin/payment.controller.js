import mongoose from "mongoose";
import Payment from "../../models/Payment.js";
import asyncHandler from "../../utils/asyncHandler.js";

function toInt(v, def) {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
}

const ALLOWED_STATUS = ["initiated", "succeeded", "failed"];
const ALLOWED_PROVIDER = ["khalti", "esewa", "bank"];

export const listPayments = asyncHandler(async (req, res) => {
  const page = Math.max(1, toInt(req.query.page, 1));
  const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));

  const status = String(req.query.status || "").trim();
  const provider = String(req.query.provider || "").trim();
  const q = String(req.query.q || "").trim();

  const match = {};
  if (status && ALLOWED_STATUS.includes(status)) match.status = status;
  if (provider && ALLOWED_PROVIDER.includes(provider)) match.provider = provider;

  const needle = q ? q.toLowerCase() : "";

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: "orders",
        localField: "order",
        foreignField: "_id",
        as: "orderDoc",
      },
    },
    { $unwind: { path: "$orderDoc", preserveNullAndEmptyArrays: true } },
  ];

  if (needle) {
    pipeline.push({
      $match: {
        $or: [
          { reference: { $regex: needle, $options: "i" } },
          { "orderDoc.orderNumber": { $regex: needle, $options: "i" } },
        ],
      },
    });
  }

  pipeline.push({ $sort: { createdAt: -1 } });

  pipeline.push({
    $facet: {
      items: [
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            provider: 1,
            amount: 1,
            status: 1,
            reference: 1,
            createdAt: 1,
            updatedAt: 1,
            order: "$orderDoc",
          },
        },
      ],
      meta: [{ $count: "total" }],
    },
  });

  const agg = await Payment.aggregate(pipeline);
  const items = agg?.[0]?.items || [];
  const total = agg?.[0]?.meta?.[0]?.total || 0;
  const pages = Math.max(1, Math.ceil(total / limit));

  res.json({
    ok: true,
    data: { items, total, page, pages, limit },
    items, total, page, pages, limit, // legacy
  });
});

export const getPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid payment id" });
  }

  const payment = await Payment.findById(id).populate("order").lean();
  if (!payment) return res.status(404).json({ message: "Payment not found" });

  res.json({
    ok: true,
    data: { payment, order: payment.order || null },
    payment,
    order: payment.order || null,
  });
});
