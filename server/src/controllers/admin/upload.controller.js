import { isCloudinaryMode, uploadToCloudinary, toPublicUploadUrl } from "../../utils/upload.js";

export const uploadSingle = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const url = isCloudinaryMode()
      ? await uploadToCloudinary(req.file, { folder: "admin" })
      : toPublicUploadUrl(req, req.file.path || req.file.filename);

    return res.status(201).json({ url });
  } catch (err) {
    next(err);
  }
};

export const uploadMany = async (req, res, next) => {
  try {
    const files = req.files || [];

    const urls = isCloudinaryMode()
      ? await Promise.all(files.map((f) => uploadToCloudinary(f, { folder: "admin" })))
      : files.map((f) => toPublicUploadUrl(req, f.path || f.filename));

    return res.status(201).json({ urls });
  } catch (err) {
    next(err);
  }
};
