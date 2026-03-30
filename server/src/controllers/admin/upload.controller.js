import { isCloudinaryMode, uploadToCloudinary, toPublicUploadUrl } from "../../utils/upload.js";

export const uploadSingle = async (req, res, next) => {
  try {
    // The 'upload' middleware (multer + processUploads) already 
    // populated req.body.file with the final URL (Cloudinary or local).
    const url = req.body.file || "";
    
    if (!url && !req.file) {
      return res.status(400).json({ message: "No file uploaded or processing failed" });
    }

    return res.status(201).json({ url });
  } catch (err) {
    next(err);
  }
};

export const uploadMany = async (req, res, next) => {
  try {
    // req.body.files (or field name used) will contain the array of URLs
    const urls = req.body.files || [];

    if (!urls.length && (!req.files || !req.files.length)) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    return res.status(201).json({ urls });
  } catch (err) {
    next(err);
  }
};
