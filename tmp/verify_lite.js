
// Simplified verification script (No external dependencies)
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

      // Mocked renaming/uploading
      const resultUrl = `/uploads/${req.uploadFolder || 'gen'}/${f.fieldname}-mock.png`;

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

async function runTests() {
    // Test Case 1: Single file (thumbnail)
    const req1 = {
      file: { fieldname: 'thumbnail', buffer: Buffer.from([1,2,3]) },
      body: {},
      uploadFolder: 'test'
    };

    await processUploads(req1, {}, () => {
      console.log("Test Case 1 (Single Thumbnail):", req1.body.thumbnail?.includes('thumbnail-mock.png') ? "PASSED" : "FAILED");
    });

    // Test Case 2: Multi files (images)
    const req2 = {
      files: [
        { fieldname: 'images', buffer: Buffer.from([1,2,3]) },
        { fieldname: 'images', buffer: Buffer.from([4,5,6]) }
      ],
      body: {},
      uploadFolder: 'devices'
    };

    await processUploads(req2, {}, () => {
        const isArr = Array.isArray(req2.body.images);
        const len2 = req2.body.images?.length === 2;
        console.log("Test Case 2 (Multi Images):", (isArr && len2) ? "PASSED" : "FAILED");
    });
}

runTests();
