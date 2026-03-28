import AuditLog from "../models/AuditLog.js";

/**
 * Phase 3: Admin audit log middleware.
 * Logs ONLY mutating requests (POST/PUT/PATCH/DELETE).
 *
 * IMPORTANT:
 * - Do NOT store passwords/tokens in logs.
 * - We keep a minimal body snapshot with basic redaction.
 */
function redactBody(body) {
  if (!body || typeof body !== "object") return body;
  const copy = Array.isArray(body) ? body.map((x) => redactBody(x)) : { ...body };

  const SENSITIVE_KEYS = [
    "password",
    "newPassword",
    "confirmPassword",
    "token",
    "refreshToken",
    "otp",
    "code",
    "secret",
  ];

  for (const k of Object.keys(copy)) {
    if (SENSITIVE_KEYS.includes(k)) copy[k] = "[REDACTED]";
    else if (typeof copy[k] === "object" && copy[k] !== null) copy[k] = redactBody(copy[k]);
  }
  return copy;
}

export function auditAdmin(action, { entityType = "", entityId = null } = {}) {
  return (req, res, next) => {
    const method = String(req.method || "").toUpperCase();
    const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    if (!isMutating) return next();

    const start = Date.now();

    res.on("finish", async () => {
      try {
        const admin = req.admin || {};
        const resolvedEntityId =
          typeof entityId === "function" ? entityId(req) : entityId || req.params?.id || "";

        await AuditLog.create({
          actor: admin?.id,
          actorEmail: admin?.email || "",
          actorRole: admin?.role || "",
          action: action || `${req.baseUrl}${req.path}`,
          method,
          path: `${req.baseUrl || ""}${req.path || ""}`,
          entityType,
          entityId: String(resolvedEntityId || ""),
          body: redactBody(req.body),
          statusCode: res.statusCode,
          requestId: req.requestId || req.headers["x-request-id"] || "",
          ip: req.ip,
          userAgent: req.headers["user-agent"] || "",
        });
      } catch (_e) {
        // never block response on audit failures
      }
    });

    return next();
  };
}

export default auditAdmin;
