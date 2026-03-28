import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

let configured = false;

export function isCloudinaryMode() {
  return String(process.env.UPLOAD_MODE || "").toLowerCase() === "cloudinary";
}

export function configureCloudinary() {
  if (configured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "UPLOAD_MODE=cloudinary but CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET are missing."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  configured = true;
}

export function uploadBufferToCloudinary(file, { folder } = {}) {
  configureCloudinary();

  if (!file?.buffer) {
    throw new Error("Expected multer memoryStorage file buffer for Cloudinary upload.");
  }

  const baseFolder = (process.env.CLOUDINARY_FOLDER || "cashyourphone").trim();
  const targetFolder = folder ? `${baseFolder}/${folder}` : baseFolder;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: targetFolder,
        resource_type: "image",
        format: "webp", // ✅ Force WebP for performance
        quality: "auto", // ✅ Automatic compression
        fetch_format: "auto", // ✅ Browser-specific optimization
        use_filename: true,
        unique_filename: true,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          secure_url: result?.secure_url || "",
          public_id: result?.public_id || "",
        });
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
}

export async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  configureCloudinary();
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`❌ Cloudinary delete error (${publicId}):`, err.message);
    throw err;
  }
}
