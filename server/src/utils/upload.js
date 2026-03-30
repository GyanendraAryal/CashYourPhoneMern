import path from "path";
import { isCloudinaryMode, uploadBufferToCloudinary } from "./cloudinary.js";

export { isCloudinaryMode };

// 🔒 Allowed MIME types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * 🔐 Validate file before upload
 */
function validateFile(file) {
  if (!file) throw new Error("No file provided");

  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new Error("Invalid file type");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large");
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];

  if (!allowedExt.includes(ext)) {
    throw new Error("Invalid file extension");
  }
}

/**
 * 🌐 Safe public URL generator (FIXED)
 */
export function toPublicUploadUrl(req, input) {
  if (!input) return null;

  let str = "";

  // normalize input
  if (typeof input === "string") {
    str = input;
  } else if (typeof input === "object" && input.url) {
    str = input.url;
  } else {
    return null;
  }

  str = str.trim();
  if (!str) return null;

  // ✅ If already full URL → return as-is
  if (str.startsWith("http://") || str.startsWith("https://")) {
    return str;
  }

  // ✅ Normalize slashes
  const normalized = str.replace(/\\/g, "/").replace(/^\/+/, "");

  // ✅ Cloudinary mode → assume already handled
  if (isCloudinaryMode()) {
    return normalized;
  }

  // ✅ If req not available → fallback (prevents crashes)
  if (!req) {
    return `/uploads/${normalized}`;
  }

  const base = `${req.protocol}://${req.get("host")}`;

  // ✅ Avoid double /uploads/
  if (normalized.startsWith("uploads/")) {
    return `${base}/${normalized}`;
  }

  return `${base}/uploads/${normalized}`;
}

/**
 * ☁️ Hardened Cloudinary upload
 */
export async function uploadToCloudinary(multerFile, { folder } = {}) {
  if (!isCloudinaryMode()) return null;

  try {
    validateFile(multerFile);

    const result = await uploadBufferToCloudinary(multerFile, {
      folder,
      resource_type: "image",
    });

    if (!result?.secure_url) {
      throw new Error("Invalid Cloudinary response");
    }

    return result.secure_url;
  } catch (err) {
    console.error("❌ Secure upload failed:", err.message);
    throw err;
  }
}