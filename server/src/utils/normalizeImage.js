export function normalizeImageField(input) {
  if (!input) return "";

  if (typeof input === "string") return input;

  if (typeof input === "object") {
    return input.url || input.secure_url || "";
  }

  return "";
}