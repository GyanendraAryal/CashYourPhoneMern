/**
 * Tiny in-memory cache for GET endpoints.
 * Good for small deployments; replace with Redis for scale.
 *
 * Usage:
 *   router.get("/", cacheSeconds(60), handler)
 */
const store = new Map();

function nowMs() {
  return Date.now();
}

export function cacheSeconds(ttlSeconds = 30) {
  const ttlMs = Math.max(1, Number(ttlSeconds) || 30) * 1000;

  return function cacheMiddleware(req, res, next) {
    if (req.method !== "GET") return next();

    const key = `${req.originalUrl}`;
    const hit = store.get(key);

    if (hit && hit.expiresAt > nowMs()) {
      res.setHeader("X-Cache", "HIT");
      return res.status(hit.status).json(hit.body);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Cache only successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        store.set(key, { status: res.statusCode, body, expiresAt: nowMs() + ttlMs });
      }
      res.setHeader("X-Cache", "MISS");
      return originalJson(body);
    };

    next();
  };
}

export function clearCache(prefix = "") {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}
