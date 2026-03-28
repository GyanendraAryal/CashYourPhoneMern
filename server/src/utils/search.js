// server/src/utils/search.js

export function clampInt(n, { min = 1, max = 50, fallback = 20 } = {}) {
  const x = parseInt(n, 10);
  if (Number.isNaN(x)) return fallback;
  return Math.max(min, Math.min(max, x));
}

export function toBool(v) {
  if (v === undefined) return undefined;
  const s = String(v).toLowerCase();
  if (s === "true") return true;
  if (s === "false") return false;
  return undefined;
}

export function escapeRegex(input = "") {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function tokenizeQuery(q = "", { maxTokens = 6, maxLen = 80 } = {}) {
  const raw = String(q || "").trim().slice(0, maxLen);
  if (!raw) return [];

  const parts = raw
    .split(/[\s,;|/]+/g)
    .map((t) => t.trim())
    .filter(Boolean);

  const tokens = [];
  for (const p of parts) {
    const t = p.replace(/[^\p{L}\p{N}._+-]/gu, "");
    if (t.length >= 2) tokens.push(t);
    if (tokens.length >= maxTokens) break;
  }
  return tokens;
}

/**
 * Sanitize for Mongo $text search.
 * - remove quotes and most special operators to keep it predictable
 * - keep letters/numbers/spaces
 */
export function sanitizeTextSearch(q = "", { maxLen = 80 } = {}) {
  const s = String(q || "").slice(0, maxLen).toLowerCase();
  const cleaned = s.replace(/[\"']/g, " ").replace(/[^a-z0-9\s]/g, " ");
  return cleaned.replace(/\s+/g, " ").trim();
}
