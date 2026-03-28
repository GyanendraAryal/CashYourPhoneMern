import crypto from "crypto";

/**
 * Adds a request id to every request for better tracing in logs.
 * Header: X-Request-Id (generated if missing)
 */
export function requestId(req, res, next) {
  const incoming = req.header("x-request-id");
  const id = incoming && String(incoming).trim() ? String(incoming).trim() : crypto.randomUUID();

  req.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
}
