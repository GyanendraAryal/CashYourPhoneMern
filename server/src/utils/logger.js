import pino from "pino";
import pinoHttp from "pino-http";

const isProd = process.env.NODE_ENV === "production";

/**
 * Base logger.
 * In production logs are JSON for easy ingestion.
 * In development, we keep it readable.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  transport: !isProd
    ? {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:standard", singleLine: true },
      }
    : undefined,
  base: { service: process.env.SERVICE_NAME || "cashyourphone-api" },
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      "req.headers['x-csrf-token']",
      "req.body.password",
      "req.body.newPassword",
      "req.body.confirmPassword",
      "req.body.otp",
      "req.body.token",
      "res.headers['set-cookie']",
    ],
    censor: "[REDACTED]",
  },
});

/**
 * HTTP logger middleware.
 * Adds: requestId, method, url, status, responseTime.
 */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.requestId || req.id,
  customProps: (req) => ({
    requestId: req.requestId,
    userId: req.user?.id || req.user?._id || undefined,
    adminId: req.admin?.id || req.admin?._id || undefined,
  }),
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
      };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
});
