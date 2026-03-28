/**
 * Basic Mongo/NoSQL injection hardening:
 * Removes keys that contain '$' or '.' from objects (recursively).
 * Prevents payloads like { "$where": "..."} or nested operator injection.
 *
 * Lightweight alternative to express-mongo-sanitize.
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.includes("$") || key.includes(".")) continue;
    clean[key] = sanitizeObject(value);
  }
  return clean;
}

export function sanitizeMongo(req, res, next) {
  try {
    if (req.body && typeof req.body === "object") req.body = sanitizeObject(req.body);
    if (req.query && typeof req.query === "object") req.query = sanitizeObject(req.query);
    if (req.params && typeof req.params === "object") req.params = sanitizeObject(req.params);
    next();
  } catch (e) {
    next(e);
  }
}
