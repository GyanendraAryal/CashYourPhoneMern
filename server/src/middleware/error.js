import { logger } from "../utils/logger.js";
import * as Sentry from "@sentry/node";

export function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Not Found: ${req.originalUrl}`));
}

/**
 * Production-friendly error handler:
 * - Maps common Mongoose errors to proper HTTP statuses
 * - Keeps stack hidden in production
 * - Returns a consistent error shape
 */
export function errorHandler(err, req, res, next) {
  let status = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  // Mongoose: invalid ObjectId
  if (err?.name === "CastError") status = 400;

  // Mongoose: schema validation
  if (err?.name === "ValidationError") status = 400;

  // Mongo duplicate key (unique index)
  if (err?.code === 11000) status = 409;

  // JWT errors
  if (err?.name === "JsonWebTokenError") status = 401;
  if (err?.name === "TokenExpiredError") status = 401;

  if (err?.isOperational || (status >= 400 && status < 500)) {
    logger.warn({ message: err.message, status, requestId: req.requestId }, "Operational error");
  } else {
    // Log with requestId for correlation
    logger.error({ 
      err: {
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code
      }, 
      requestId: req.requestId 
    }, "Unhandled error");

    // Send to Sentry if configured
    if (process.env.SENTRY_DSN) {
      try {
        Sentry.captureException(err, { tags: { requestId: req.requestId } });
      } catch (_) {}
    }
  }

  // Mongoose: schema validation
  if (err?.name === "ValidationError") status = 400;

  // Mongo duplicate key (unique index)
  if (err?.code === 11000) status = 409;

  // JWT errors
  if (err?.name === "JsonWebTokenError") status = 401;
  if (err?.name === "TokenExpiredError") status = 401;

  const payload = {
    error: true,
    status: `${status}`.startsWith("4") ? "fail" : "error",
    message: err?.message || "Server error",
    requestId: req.requestId,
  };

  if (process.env.NODE_ENV !== "production") {
    payload.stack = err?.stack;
    if (err?.name) payload.name = err.name;
    if (err?.code) payload.code = err.code;
    if (err?.errors) payload.details = err.errors;
  }

  res.status(status).json(payload);
}
