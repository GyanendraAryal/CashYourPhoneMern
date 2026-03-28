import sanitizeHtml from "sanitize-html";

/**
 * Strips HTML tags/attributes from incoming strings to reduce XSS risk.
 * - Keeps plain text only
 * - Runs on req.body + req.query (and optionally req.params)
 *
 * NOTE:
 * This is NOT a replacement for output escaping in React.
 * It’s a backend safety layer to prevent storing/reflecting HTML payloads.
 */

function cleanString(value) {
  if (typeof value !== "string") return value;

  // Remove all tags/attributes, keep text only
  const cleaned = sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  });

  // Optional: trim excessive whitespace
  return cleaned.trim();
}

function deepClean(obj) {
  if (!obj) return obj;

  if (Array.isArray(obj)) {
    return obj.map(deepClean);
  }

  if (typeof obj === "object") {
    for (const k of Object.keys(obj)) {
      obj[k] = deepClean(obj[k]);
    }
    return obj;
  }

  return cleanString(obj);
}

export function sanitizeXss(req, res, next) {
  try {
    if (req.body) deepClean(req.body);
    if (req.query) deepClean(req.query);
    // req.params are usually IDs, but safe to clean if you want:
    // if (req.params) deepClean(req.params);

    return next();
  } catch (err) {
    return next(err);
  }
}
