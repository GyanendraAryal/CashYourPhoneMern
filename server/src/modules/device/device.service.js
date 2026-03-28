import Device from "../../models/Device.js";
import mongoose from "mongoose";
import { isCloudinaryMode, uploadToCloudinary } from "../../utils/upload.js";
import { clampInt, sanitizeTextSearch, tokenizeQuery, escapeRegex, toBool } from "../../utils/search.js";
import AppError from "../../utils/AppError.js";
import mlService from "../../services/ml.service.js";

const ALLOWED_CONDITIONS = ["new", "like_new", "pre_owned", "refurbished"];
const ALLOWED_AVAILABILITY = ["in_stock", "out_of_stock", "coming_soon"];

const slugify = (str = "") =>
  String(str)
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const makeUniqueSlug = async (base) => {
  const baseSlug = slugify(base) || "device";
  let candidate = baseSlug;
  let i = 0;
  while (await Device.exists({ slug: candidate })) {
    i += 1;
    candidate = `${baseSlug}-${i}`;
  }
  return candidate;
};

const toPublicUploadPath = (filePath) => {
  if (!filePath) return "";
  const normalized = String(filePath).replace(/\\/g, "/");
  const idx = normalized.indexOf("/uploads");
  return idx === -1 ? "" : normalized.slice(idx);
};

/**
 * LIST devices with advanced filtering and search
 */
export const queryDevices = async (queryParams, isAuthed = false) => {
  const { q = "", brand, featured, condition, availability, minPrice, maxPrice, sort } = queryParams;

  const page = clampInt(queryParams.page, { min: 1, max: 10000, fallback: 1 });
  const limit = clampInt(queryParams.limit, { min: 1, max: 50, fallback: 20 });
  const skip = (page - 1) * limit;

  const filters = {};
  if (!isAuthed) {
    filters.featured = true;
  } else {
    const f = toBool(featured);
    if (f !== undefined) filters.featured = f;
  }

  if (brand) filters.brand = String(brand).trim();
  if (condition) filters.condition = String(condition).toLowerCase().trim().replace(/\s|-/g, "_");
  if (availability) filters.availability = String(availability).toLowerCase().trim().replace(/\s|-/g, "_");

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
    const or = tokens.slice(0, 3).flatMap(t => {
      const rx = new RegExp(`^${escapeRegex(t)}`, "i");
      return [{ name: rx }, { brand: rx }];
    });
    pipeline.push({ $match: { ...filters, $or: or } });
    pipeline.push({ $addFields: { _score: 0 } });
  } else {
    pipeline.push({ $match: filters });
    pipeline.push({ $addFields: { _score: 0 } });
  }

  const finalSort = String(sort || "").trim() || (useText ? "relevance" : "newest");
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

  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
};

/**
 * GET single device
 */
export const getDeviceById = async (id, isAuthed = false) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid device ID", 400);

  const query = { _id: id };
  if (!isAuthed) query.featured = true;

  const device = await Device.findOne(query);
  if (!device) throw new AppError("Device not found", 404);
  return device;
};

/**
 * CREATE device (Admin Only)
 */
export const createDevice = async (deviceData, files = {}) => {
  const { name, slug } = deviceData;
  if (!name) throw new AppError("Device name is required", 400);

  let thumbnail = "";
  let images = [];

  const thumbnailFile = files.thumbnail?.[0];
  const imageFiles = files.images || [];

  if (thumbnailFile) {
    thumbnail = isCloudinaryMode() 
      ? await uploadToCloudinary(thumbnailFile, { folder: "cashyourphone/devices" })
      : toPublicUploadPath(thumbnailFile.path);
  } else if (deviceData.thumbnail) {
    thumbnail = deviceData.thumbnail;
  }

  if (imageFiles.length) {
    images = isCloudinaryMode()
      ? await Promise.all(imageFiles.map(f => uploadToCloudinary(f, { folder: "cashyourphone/devices" })))
      : imageFiles.map(f => toPublicUploadPath(f.path)).filter(Boolean);
  } else if (deviceData.images) {
    images = Array.isArray(deviceData.images) ? deviceData.images : [deviceData.images];
  }

  const finalSlug = slug ? slugify(slug) : await makeUniqueSlug(name);

  return await Device.create({
    ...deviceData,
    slug: finalSlug,
    thumbnail,
    images,
  });
};

/**
 * UPDATE device (Admin Only)
 */
export const updateDevice = async (id, updateData, files = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid device ID", 400);

  const thumbnailFile = files.thumbnail?.[0];
  const imageFiles = files.images || [];

  if (thumbnailFile) {
    updateData.thumbnail = isCloudinaryMode()
      ? await uploadToCloudinary(thumbnailFile, { folder: "cashyourphone/devices" })
      : toPublicUploadPath(thumbnailFile.path);
  }

  if (imageFiles.length) {
    updateData.images = isCloudinaryMode()
      ? await Promise.all(imageFiles.map(f => uploadToCloudinary(f, { folder: "cashyourphone/devices" })))
      : imageFiles.map(f => toPublicUploadPath(f.path)).filter(Boolean);
  }

  if (updateData.slug) updateData.slug = slugify(updateData.slug);

  const device = await Device.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!device) throw new AppError("Device not found", 404);
  return device;
};

/**
 * DELETE device (Admin Only)
 */
export const deleteDevice = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid device ID", 400);
  
  const device = await Device.findById(id);
  if (!device) throw new AppError("Device not found", 404);

  // If Cloudinary mode, cleanup remote assets
  if (isCloudinaryMode()) {
    const { deleteFromCloudinary } = await import("../../utils/cloudinary.js");
    const paths = [device.thumbnail, ...(device.images || [])].filter(p => p && p.includes("res.cloudinary.com"));
    
    for (const p of paths) {
      try {
        const parts = p.split("/");
        const last = parts.pop() || "";
        const publicIdWithExt = last.split(".")[0];
        // This is a bit naive for nested folders, better to store public_id in DB
        // For now, let's just delete from DB.
      } catch (e) {
        console.warn("Cleanup failed for:", p);
      }
    }
  }

  await device.deleteOne();
  return device;
};

/**
 * GET similar device recommendations
 */
export const getSimilarDevices = async (deviceId) => {
  if (!mongoose.Types.ObjectId.isValid(deviceId)) return [];

  const device = await Device.findById(deviceId);
  if (!device) return [];

  // Query catalog subset
  const allDevices = await Device.find({ 
    _id: { $ne: deviceId }, 
    availability: "in_stock" 
  }).limit(50).lean();

  const candidates = [];
  const currentPrice = Number(device.price) || 0;

  // Native Recommendation Algorithm (Ported from ML microservice)
  for (const d of allDevices) {
    let score = 0;
    
    // Brand match (Strong Signal)
    if (d.brand === device.brand) score += 50;

    // Price proximity (Logarithmic difference)
    const dPrice = Number(d.price) || 0;
    if (dPrice > 0 && currentPrice > 0) {
      const diff = Math.abs(dPrice - currentPrice) / Math.max(dPrice, currentPrice);
      score += Math.max(0, 50 * (1 - diff));
    }

    if (score > 30) {
      candidates.push({ id: d._id, score });
    }
  }

  // Sort by score and return top 4
  candidates.sort((a, b) => b.score - a.score);
  const topIds = candidates.slice(0, 4).map(c => c.id);

  if (topIds.length > 0) {
    const fetched = await Device.find({ _id: { $in: topIds } });
    return topIds.map(id => fetched.find(f => f._id.equals(id))).filter(Boolean);
  }

  return [];
};
