import * as sellService from "../services/sell.service.js";
import { isCloudinaryMode, toPublicUploadUrl, uploadToCloudinary } from "../utils/upload.js";

function toStoredUploadPath(filePathOrUrl) {
  if (!filePathOrUrl) return "";
  const str = String(filePathOrUrl);
  if (/^https?:\/\//i.test(str)) return str;
  const normalized = str.replace(/\\/g, "/");
  if (normalized.startsWith("uploads/")) return `/${normalized}`;
  const idx = normalized.lastIndexOf("/uploads/");
  if (idx !== -1) return normalized.slice(idx);
  if (normalized.startsWith("/uploads/")) return normalized;
  return normalized;
}

export async function createSellRequest(req, res, next) {
  try {
    const { fullName, phone, deviceName } = req.body;
    if (!fullName || !phone || !deviceName) {
      return res.status(400).json({ message: "fullName, phone, and deviceName are required." });
    }
    
    // Parse uploaded files
    const files = req.files || [];
    let storedImages = [];
    if (files.length) {
      if (isCloudinaryMode()) {
        const results = await Promise.all(
          files.map((f) => uploadToCloudinary(f, { folder: "sell" }))
        );
        storedImages = results.filter(Boolean);
      } else {
        storedImages = files.map((f) => toStoredUploadPath(f.path));
      }
    }

    const doc = await sellService.submitSellRequest(req.user.id, req.body, storedImages);

    const out = {
      ...doc.toObject(),
      images: (doc.images || []).map((p) => toPublicUploadUrl(req, p)),
    };

    res.status(201).json({ sellRequest: out });
  } catch (err) {
    next(err);
  }
}

export async function listMySellRequests(req, res, next) {
  try {
    const { items, total, page, limit } = await sellService.getMySellRequests(req.user.id, req.query);

    const out = items.map((doc) => ({
      ...doc.toObject(),
      images: (doc.images || []).map((p) => toPublicUploadUrl(req, p)),
    }));

    res.json({ total, page, limit, items: out });
  } catch (e) {
    next(e);
  }
}