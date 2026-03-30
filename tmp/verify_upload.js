import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';

// Mocking dependencies since we can't easily import from the project in a standalone script without setup
const isCloudinaryMode = () => false; // Testing local mode first
const AppError = class extends Error { constructor(m, s) { super(m); this.status = s; } };

async function processUploads(req, res, next) {
  try {
    const files = req.files
      ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
      : req.file
      ? [req.file]
      : [];

    const fieldResults = {}; 
    
    for (const f of files) {
      if (!f.buffer) continue;

      const type = await fileTypeFromBuffer(f.buffer);
      if (!type || !["image/jpeg", "image/png", "image/webp"].includes(type.mime)) {
        throw new AppError("Invalid file content signature.", 400);
      }

      f.filename = `${f.fieldname}-${crypto.randomUUID()}.${type.ext}`;

      let resultUrl = "";

      if (isCloudinaryMode()) {
        resultUrl = `https://cloudinary.com/fake/${f.filename}`;
      } else {
        const subFolder = req.uploadFolder || "general";
        resultUrl = `/uploads/${subFolder}/${f.filename}`;
      }

      if (!fieldResults[f.fieldname]) {
        fieldResults[f.fieldname] = [];
      }
      fieldResults[f.fieldname].push(resultUrl);
    }

    for (const [field, urls] of Object.entries(fieldResults)) {
      if (urls.length === 1 && field !== "images") {
        req.body[field] = urls[0];
      } else {
        req.body[field] = urls;
      }
    }

    next();
  } catch (error) {
    console.error("Error in processUploads:", error);
  }
}

// Test Case 1: Single file (thumbnail)
const req1 = {
  file: { fieldname: 'thumbnail', buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]) }, // JPG magic number
  body: {},
  uploadFolder: 'test'
};

processUploads(req1, {}, () => {
  console.log("Test Case 1 (Single Thumbnail):", req1.body.thumbnail.startsWith('/uploads/test/thumbnail-') ? "PASSED" : "FAILED");
});

// Test Case 2: Multi files (images)
const req2 = {
  files: [
    { fieldname: 'images', buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) }, // PNG magic number
    { fieldname: 'images', buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) }
  ],
  body: {},
  uploadFolder: 'devices'
};

processUploads(req2, {}, () => {
    console.log("Test Case 2 (Multi Images):");
    console.log(" - Is Array?", Array.isArray(req2.body.images));
    console.log(" - Length is 2?", req2.body.images?.length === 2);
    if (Array.isArray(req2.body.images) && req2.body.images.length === 2) {
        console.log("PASSED");
    } else {
        console.log("FAILED");
    }
});
