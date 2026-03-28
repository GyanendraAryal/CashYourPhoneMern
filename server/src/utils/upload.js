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

  // extra extension check
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];

  if (!allowedExt.includes(ext)) {
    throw new Error("Invalid file extension");
  }
}

/**
 * 🔒 Safe public URL generator
 */
export function toPublicUploadUrl(req, filePathOrUrl) {
  if (!req || !filePathOrUrl) return "";

  const base = `${req.protocol}://${req.get("host")}`;
  const str = String(filePathOrUrl).trim();

  // 🚫 Block unknown external URLs
  if (str.startsWith("http://") || str.startsWith("https://")) {
    // allow only your CDN (optional)
    if (!str.includes("cloudinary.com")) {
      return ""; // block unknown domains
    }
    return str;
  }

  const normalized = str.replace(/\\/g, "/").replace(/\.\.+/g, "");

  // Windows absolute paths: .../server/uploads/general/file.jpg → /uploads/general/file.jpg
  const uploadsIdx = normalized.toLowerCase().indexOf("/uploads/");
  if (uploadsIdx !== -1) {
    return `${base}${normalized.slice(uploadsIdx)}`;
  }

  if (normalized.startsWith("/uploads/")) return `${base}${normalized}`;
  if (normalized.startsWith("uploads/")) return `${base}/${normalized}`;

  return `${base}/uploads/${normalized.replace(/^\/+/, "")}`;
}

/**
 * 🔐 Hardened Cloudinary upload
 */
export async function uploadToCloudinary(multerFile, { folder } = {}) {
  if (!isCloudinaryMode()) {
    return null;
  }

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