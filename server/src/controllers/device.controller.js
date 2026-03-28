// server/src/controllers/device.controller.js

import Device from "../models/Device.js";
import mongoose from "mongoose";
import {
  clampInt,
  sanitizeTextSearch,
  tokenizeQuery,
  toBool,
  escapeRegex,
} from "../utils/search.js";

const ALLOWED_CONDITIONS = ["new", "like_new", "pre_owned", "refurbished"];
const ALLOWED_AVAILABILITY = ["in_stock", "out_of_stock", "coming_soon"];

const normalizeEnum = (v = "") =>
  String(v).toLowerCase().trim().replace(/\s|-/g, "_");

export async function listDevices(req, res, next) {
  try {
    const {
      q = "",
      brand,
      featured,
      condition,
      availability,
      minPrice,
      maxPrice,
      sort,
    } = req.query;

    const page = clampInt(req.query.page, { min: 1, max: 10000, fallback: 1 });
    const limit = clampInt(req.query.limit, { min: 1, max: 50, fallback: 20 });
    const skip = (page - 1) * limit;

    const isAuthed = Boolean(req.user?.id);

    const filters = {};

    // Visitors can only see featured devices (do NOT allow bypass via query)
    if (!isAuthed) {
      filters.featured = true;
    } else {
      const f = toBool(featured);
      if (f !== undefined) filters.featured = f;
    }

    if (condition) {
      const normalized = normalizeEnum(condition);
      if (!ALLOWED_CONDITIONS.includes(normalized)) {
        return res.status(400).json({
          success: false,
          message: `Invalid condition: ${condition}`,
        });
      }
      filters.condition = normalized;
    }

    if (availability) {
      const normalized = normalizeEnum(availability);
      if (!ALLOWED_AVAILABILITY.includes(normalized)) {
        return res.status(400).json({
          success: false,
          message: `Invalid availability: ${availability}`,
        });
      }
      filters.availability = normalized;
    }

    if (brand) {
      filters.brand = String(brand).trim();
    }

    const priceFilter = {};
    if (minPrice !== undefined)
      priceFilter.$gte = Math.max(0, Number(minPrice));
    if (maxPrice !== undefined)
      priceFilter.$lte = Math.max(0, Number(maxPrice));
    if (Object.keys(priceFilter).length) filters.price = priceFilter;

    const rawQ = String(q || "").trim();
    const textQ = sanitizeTextSearch(rawQ, { maxLen: 80 });
    const tokens = tokenizeQuery(rawQ, { maxTokens: 6, maxLen: 80 });

    const useText = textQ.length >= 2;
    const usePrefixFallback = !useText && tokens.length > 0;

    const pipeline = [];

    if (useText) {
      pipeline.push({ $match: { ...filters, $text: { $search: textQ } } });
      pipeline.push({ $addFields: { _score: { $meta: "textScore" } } });
    } else if (usePrefixFallback) {
      // SAFE prefix regex (anchored), escaped, limited tokens
      const or = tokens
        .slice(0, 3)
        .map((t) => {
          const rx = new RegExp(`^${escapeRegex(t)}`, "i");
          return [{ name: rx }, { brand: rx }];
        })
        .flat()
        .map((x) => {
          const k = Object.keys(x)[0];
          return { [k]: x[k] };
        });

      pipeline.push({ $match: { ...filters, $or: or } });
      pipeline.push({ $addFields: { _score: 0 } });
    } else {
      pipeline.push({ $match: filters });
      pipeline.push({ $addFields: { _score: 0 } });
    }

    const finalSort =
      String(sort || "").trim() || (useText ? "relevance" : "newest");

    if (finalSort === "relevance") {
      pipeline.push({ $sort: { _score: -1, createdAt: -1 } });
    } else if (finalSort === "price_asc") {
      pipeline.push({ $sort: { price: 1, createdAt: -1 } });
    } else if (finalSort === "price_desc") {
      pipeline.push({ $sort: { price: -1, createdAt: -1 } });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push({
      $facet: {
        items: [
          { $skip: skip },
          { $limit: limit },
          { $project: {
              name: 1,
              brand: 1,
              price: 1,
              condition: 1,
              availability: 1,
              featured: 1,
              thumbnail: 1,
              // keep only the first image to avoid overfetching on card lists
              images: { $slice: ["$images", 1] },
              feature: 1
            } }
        ],
        meta: [{ $count: "total" }],
      },
    });

    const agg = await Device.aggregate(pipeline);
    const items = agg?.[0]?.items || [];
    const total = agg?.[0]?.meta?.[0]?.total || 0;

    return res.json({
      success: true,
      data: items,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    next(err);
  }
}

export async function getDevice(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    const isAuthed = Boolean(req.user?.id);

    const query = { _id: id };
    // Keep visibility consistent with list: visitors can only access featured devices
    if (!isAuthed) query.featured = true;

    const device = await Device.findOne(query).select(
      "name brand price condition availability featured thumbnail images feature description slug createdAt updatedAt"
    );
    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found" });
    }
    return res.json({ success: true, data: device });
  } catch (err) {
    next(err);
  }
}
