import { API_BASE_URL } from "./constants";

export const normalizeId = (obj) =>
  obj?._id || obj?.id || obj?.ID || "";

/**
 * ✅ FIXED: smarter + safer image resolver
 */
function resolveImageUrl(p, fallback = "/phone-placeholder.png") {
  if (!p || typeof p !== "string") return fallback;

  const str = p.trim();
  if (!str) return fallback;

  // ✅ already full URL (backend handled it)
  if (str.startsWith("http://") || str.startsWith("https://")) {
    return str;
  }

  // ✅ local uploads (only if backend DID NOT convert)
  if (str.startsWith("/uploads/")) return `${API_BASE_URL}${str}`;
  if (str.startsWith("uploads/")) return `${API_BASE_URL}/${str}`;

  // ✅ frontend assets
  if (str.startsWith("/")) return str;

  return fallback;
}

const conditionLabel = {
  new: "New",
  like_new: "Like New",
  pre_owned: "Pre-owned",
  refurbished: "Refurbished",
};

const availabilityLabel = {
  in_stock: "In Stock",
  out_of_stock: "Out of Stock",
  coming_soon: "Coming Soon",
};

export const normalizeDevice = (d, opts = {}) => {
  const { includeImages = false, includeRaw = false } = opts || {};

  const _id = d?._id ? String(d._id) : "";
  const id = normalizeId(d);

  const conditionKey =
    typeof d?.condition === "string"
      ? d.condition.toLowerCase().trim().replace(/\s|-/g, "_")
      : "";

  const availabilityKey =
    typeof d?.availability === "string"
      ? d.availability.toLowerCase().trim().replace(/\s|-/g, "_")
      : "";

  const rawImg =
    d?.thumbnail ||
    (Array.isArray(d?.images) ? d.images[0] : "") ||
    d?.image ||
    "";

  const base = {
    _id: _id || null,
    id,

    name: d?.name?.trim() || "Unnamed Device",
    brand: d?.brand?.trim() || "Unknown Brand",
    price: Number(d?.price ?? 0),

    conditionKey,
    condition: conditionLabel[conditionKey] || "Unknown",

    availabilityKey,
    availability: availabilityLabel[availabilityKey] || "Unknown",

    featured: Boolean(d?.featured),

    feature: typeof d?.feature === "string" ? d.feature.trim() : "",
    description:
      typeof d?.description === "string" ? d.description.trim() : "",

    thumbnail: d?.thumbnail || "",

    // ✅ FIX: guaranteed safe image
    image: resolveImageUrl(rawImg),
  };

  // ✅ FIX: safe images array
  base.images =
    includeImages && Array.isArray(d?.images)
      ? d.images
          .map((p) => resolveImageUrl(p))
          .filter(Boolean)
      : [];

  if (includeRaw) base.raw = d;

  return base;
};

/**
 * ✅ SIMPLIFIED + SAFE
 */
export const normalizeSlide = (s) => {
  const image =
    s?.image ||
    s?.imageUrl ||
    s?.imageDesktop ||
    s?.imageDesktopUrl ||
    "";

  const imageMobile = 
    s?.imageMobile || 
    s?.imageMobileUrl || 
    "";

  return {
    id: normalizeId(s),

    imageUrl: resolveImageUrl(image, "/placeholder.png"),
    imageDesktopUrl: resolveImageUrl(image, "/placeholder.png"),
    imageMobileUrl: resolveImageUrl(
      imageMobile,
      ""
    ),

    title: s?.title || "",
    subtitle: s?.subtitle || "",
    linkUrl: s?.linkUrl || "",

    raw: s,
  };
};

export const normalizeReview = (r) => {
  return {
    id: normalizeId(r),
    name: r?.name || "Anonymous",
    email: r?.email || "",
    rating: Number(r?.rating ?? 5),
    content: r?.message || r?.content || "",
    avatarUrl: resolveImageUrl(r?.avatar || ""),
    createdAt: r?.createdAt || "",
    raw: r,
  };
};