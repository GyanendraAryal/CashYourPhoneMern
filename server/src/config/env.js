//Minimal env validation (no external deps).
//Fails fast in production if required variables are missing.

function assertStrong(secret, name) {
  if (String(secret || "").trim().length < 32) {
    throw new Error(`${name} is too short for production. Use 32+ random chars.`);
  }
}

function isProd() {
  return process.env.NODE_ENV === "production";
}

export function assertEnv() {
  if (!isProd()) return;

  const requiredBase = ["MONGO_URI", "ADMIN_JWT_SECRET"];
  const missingBase = requiredBase.filter(
    (k) => !process.env[k] || !String(process.env[k]).trim()
  );
  if (missingBase.length) {
    throw new Error(
      `Missing required environment variables in production: ${missingBase.join(", ")}`
    );
  }

  // Auth secrets: allow either dedicated secrets OR a single JWT_SECRET fallback.
  const hasAccess = Boolean(String(process.env.JWT_ACCESS_SECRET || "").trim());
  const hasRefresh = Boolean(String(process.env.JWT_REFRESH_SECRET || "").trim());
  const hasSingle = Boolean(String(process.env.JWT_SECRET || "").trim());

  if (!((hasAccess && hasRefresh) || hasSingle)) {
    throw new Error(
      "Missing JWT secrets in production. Provide JWT_ACCESS_SECRET + JWT_REFRESH_SECRET (recommended) OR JWT_SECRET."
    );
  }

  if (hasAccess) assertStrong(process.env.JWT_ACCESS_SECRET, "JWT_ACCESS_SECRET");
  if (hasRefresh) assertStrong(process.env.JWT_REFRESH_SECRET, "JWT_REFRESH_SECRET");
  if (hasSingle) assertStrong(process.env.JWT_SECRET, "JWT_SECRET");

  assertStrong(process.env.ADMIN_JWT_SECRET, "ADMIN_JWT_SECRET");

  const paymentKeys = ["ESEWA_SECRET_KEY", "SERVER_PUBLIC_URL"];
  const missingPayment = paymentKeys.filter(
    (k) => !process.env[k] || !String(process.env[k]).trim()
  );
  if (missingPayment.length) {
    throw new Error(
      `Missing required environment variables in production: ${missingPayment.join(", ")}`
    );
  }

  const hasClientApp =
    Boolean(String(process.env.CLIENT_APP_URL || "").trim()) ||
    Boolean(String(process.env.FRONTEND_URL || "").trim());
  if (!hasClientApp) {
    throw new Error(
      "Missing required environment variable in production: CLIENT_APP_URL or FRONTEND_URL"
    );
  }
}

export function getCorsOrigins() {
  return (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getPort() {
  return Number(process.env.PORT || 4000);
}

export function getIsProd() {
  return isProd();
}
