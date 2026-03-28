import Device from "../../models/Device.js";
import mongoose from "mongoose";
import { isCloudinaryMode, uploadToCloudinary } from "../../utils/upload.js";
import { clampInt, sanitizeTextSearch, tokenizeQuery, escapeRegex, toBool } from "../../utils/search.js";

/* -------------------- helpers -------------------- */

function toPublicUploadPath(filePath) {
  if (!filePath) return "";
  const normalized = String(filePath).replace(/\\/g, "/");
  const idx = normalized.indexOf("/uploads");
  if (idx === -1) return "";
  return normalized.slice(idx);
}

function slugify(str = "") {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function makeUniqueSlug(base) {
  const baseSlug = slugify(base) || "device";
  let candidate = baseSlug;
  let i = 0;

  while (await Device.exists({ slug: candidate })) {
    i += 1;
    candidate = `${baseSlug}-${i}`;
  }
  return candidate;
}

function normalizeCondition(label) {
  return String(label).toLowerCase().replace(/\s|-/g, "_");
}

const ALLOWED_CONDITIONS = ["new", "like_new", "pre_owned", "refurbished"];


function isValidImageUrl(v) {
  if (!v) return false;
  const s = String(v);
  return /^https?:\/\//.test(s) || s.startsWith("/uploads/");
}

function normalizeImageList(input) {
  if (!input) return [];
  // If it's already an array
  if (Array.isArray(input)) return input.map(String).filter(Boolean);
  // If it's a JSON string array
  if (typeof input === "string") {
    const trimmed = input.trim();
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch (_) {
      // fallback: comma-separated
      return trimmed
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }
  }
  return [];
}


/* -------------------- controllers -------------------- */

export const list = async (req, res, next) => {
  try {
    const {
      q = "",
      featured,
      brand,
      condition,
      availability,
      minPrice,
      maxPrice,
      sort,
    } = req.query;

    const page = clampInt(req.query.page, { min: 1, max: 10000, fallback: 1 });
    const limit = clampInt(req.query.limit, { min: 1, max: 50, fallback: 20 });
    const skip = (page - 1) * limit;

    const filters = {};

    const f = toBool(featured);
    if (f !== undefined) filters.featured = f;

    if (brand) filters.brand = String(brand).trim();
    if (condition) filters.condition = String(condition).trim();
    if (availability) filters.availability = String(availability).trim();

    const priceFilter = {};
    if (minPrice !== undefined) priceFilter.$gte = Math.max(0, Number(minPrice));
    if (maxPrice !== undefined) priceFilter.$lte = Math.max(0, Number(maxPrice));
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

    if (finalSort === "relevance") pipeline.push({ $sort: { _score: -1, createdAt: -1 } });
    else if (finalSort === "price_asc") pipeline.push({ $sort: { price: 1, createdAt: -1 } });
    else if (finalSort === "price_desc") pipeline.push({ $sort: { price: -1, createdAt: -1 } });
    else pipeline.push({ $sort: { createdAt: -1 } });

    pipeline.push({
      $facet: {
        items: [{ $skip: skip }, { $limit: limit }],
        meta: [{ $count: "total" }],
      },
    });

    const agg = await Device.aggregate(pipeline);
    const items = agg?.[0]?.items || [];
    const total = agg?.[0]?.meta?.[0]?.total || 0;

    return res.json({
      items,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    next(err);
  }
};


export const getOne = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const item = await Device.findById(id);
    if (!item) return res.status(404).json({ message: "Device not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const {
      name,
      brand,
      price,
      feature,
      condition,
      availability,
      featured,
      description,
      storageOptions,
      slug,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    let finalCondition = condition;
    if (finalCondition) {
      finalCondition = normalizeCondition(finalCondition);
      if (!ALLOWED_CONDITIONS.includes(finalCondition)) {
        return res.status(400).json({ message: "Invalid condition" });
      }
    }

    const thumbnailFile = req.files?.thumbnail?.[0];
const imageFiles = req.files?.images || [];

// Prefer multipart uploads (files), but allow JSON URL payloads too
let thumbnail = "";
let images = [];

if (thumbnailFile) {
  if (isCloudinaryMode()) {
    thumbnail = await uploadToCloudinary(thumbnailFile, { folder: "cashyourphone/devices" });
  } else {
    thumbnail = toPublicUploadPath(thumbnailFile.path);
  }
}

if (imageFiles.length) {
  if (isCloudinaryMode()) {
    images = await Promise.all(
      imageFiles.map((f) => uploadToCloudinary(f, { folder: "cashyourphone/devices" }))
    );
  } else {
    images = imageFiles.map((f) => toPublicUploadPath(f.path)).filter(Boolean);
  }
}

if (!thumbnail && req.body?.thumbnail && isValidImageUrl(req.body.thumbnail)) {
  thumbnail = String(req.body.thumbnail);
}

if (!images.length && req.body?.images) {
  const list = normalizeImageList(req.body.images).filter(isValidImageUrl);
  images = list;
}

const finalSlug = slug ? slugify(slug) : await makeUniqueSlug(name);

    const created = await Device.create({
      name,
      slug: finalSlug,
      brand,
      price,
      feature,
      condition: finalCondition,
      availability,
      featured,
      description,
      storageOptions,
      thumbnail,
      images,
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const data = { ...req.body };

    if (data.condition) {
      data.condition = normalizeCondition(data.condition);
      if (!ALLOWED_CONDITIONS.includes(data.condition)) {
        return res.status(400).json({ message: "Invalid condition" });
      }
    }

    if (data.slug) data.slug = slugify(data.slug);

    const thumbnailFile = req.files?.thumbnail?.[0];
    const imageFiles = req.files?.images || [];

    if (thumbnailFile) {
      if (isCloudinaryMode()) {
        data.thumbnail = await uploadToCloudinary(thumbnailFile, { folder: "cashyourphone/devices" });
      } else {
        data.thumbnail = toPublicUploadPath(thumbnailFile.path);
      }
    }

if (imageFiles.length) {
  if (isCloudinaryMode()) {
    data.images = await Promise.all(
      imageFiles.map((f) => uploadToCloudinary(f, { folder: "cashyourphone/devices" }))
    );
  } else {
    data.images = imageFiles.map((f) => toPublicUploadPath(f.path)).filter(Boolean);
  }
} else if (data.images !== undefined) {
      // Allow updating images via JSON (array or JSON string)
      const list = normalizeImageList(data.images).filter(isValidImageUrl);
      data.images = list;
    }

    if (!thumbnailFile && data.thumbnail !== undefined) {
      // Allow updating thumbnail via JSON url
      if (isValidImageUrl(data.thumbnail)) {
        data.thumbnail = String(data.thumbnail);
      } else if (data.thumbnail === "" || data.thumbnail === null) {
        data.thumbnail = "";
      } else {
        return res.status(400).json({ message: "Invalid thumbnail URL" });
      }
    }

    const item = await Device.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!item) return res.status(404).json({ message: "Device not found" });

    res.json(item);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const item = await Device.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ message: "Device not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};