// client/src/utils/constants.js

function requireEnv(key) {
  const v = import.meta.env[key];
  const value = typeof v === "string" ? v.trim() : "";
  if (import.meta.env.PROD && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function inferDevApiUrl() {
  // Match hostname to avoid cookie host mismatch (localhost vs 127.0.0.1)
  const host =
    typeof window !== "undefined" && window.location?.hostname
      ? window.location.hostname
      : "localhost";
  return `http://${host}:4000`;
}

// In production, VITE_API_URL must be set. In dev, auto-match current host.
export const API_BASE_URL = requireEnv("VITE_API_URL") || inferDevApiUrl();

// Static assets (Vite serves /public at root)
export const STATIC_ASSETS_BASE = "";
