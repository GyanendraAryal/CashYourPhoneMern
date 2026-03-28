import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileTypeFromBuffer } from "file-type";
import { isCloudinaryMode } from "../utils/cloudinary.js";
import AppError from "../utils/AppError.js";

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new AppError("Only image files (JPEG, PNG, WEBP) are allowed!", 400));
};

const multerInstance = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Middleware to set custom upload folder
export const setUploadFolder = (folder) => (req, res, next) => {
  req.uploadFolder = folder;
  next();
};

// Post-upload processing (Magic numbers, UUIDs, local save)
const processUploads = async (req, res, next) => {
  try {
    const files = req.files
      ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
      : req.file ? [req.file] : [];

    for (const f of files) {
      if (!f.buffer) continue;

      // 1. Validate magic number
      const type = await fileTypeFromBuffer(f.buffer);
      if (!type || !["image/jpeg", "image/png", "image/webp"].includes(type.mime)) {
        return next(new AppError("Invalid file content signature. Security check failed.", 400));
      }

      // 2. Rename file securely with UUID format
      f.filename = `${f.fieldname}-${crypto.randomUUID()}.${type.ext}`;

      // 3. If local mode, persist to disk so `.path` is available and compatible with controllers
      if (!isCloudinaryMode()) {
        const subFolder = req.uploadFolder || "general";
        const destDir = path.resolve(`uploads/${subFolder}`);
        ensureDir(destDir);

        f.path = path.join(destDir, f.filename);
        await fs.promises.writeFile(f.path, f.buffer);
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Export wrapper that supplies the array of middlewares
const upload = {
  single: (field) => [multerInstance.single(field), processUploads],
  array: (field, maxCount) => [multerInstance.array(field, maxCount), processUploads],
  fields: (fields) => [multerInstance.fields(fields), processUploads],
};

export default upload;
