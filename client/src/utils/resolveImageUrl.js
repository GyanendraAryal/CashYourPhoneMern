import { API_BASE_URL } from "./constants";

export function resolveImageUrl(imgPath, fallback = "/phone-placeholder.png") {
  if (!imgPath || typeof imgPath !== "string") return fallback;

  // Full URL already (Cloudinary or any CDN)
  if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) return imgPath;

  // Backend uploads should be prefixed with API base (dev local fallback only)
  if (imgPath.startsWith("/uploads/")) return `${API_BASE_URL}${imgPath}`;
  if (imgPath.startsWith("uploads/")) return `${API_BASE_URL}/${imgPath}`;

  // Client-public asset
  if (imgPath.startsWith("/")) return imgPath;

  return imgPath;
}
