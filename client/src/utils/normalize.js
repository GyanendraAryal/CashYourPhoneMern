import { API_BASE_URL } from "./constants";

export const normalizeId = (obj) => obj?._id || obj?.id || obj?.ID || "";

function resolveImageUrl(p, fallback = "/phone-placeholder.png") {
  if (!p || typeof p !== "string") return fallback;

  // already full URL
  if (p.startsWith("http://") || p.startsWith("https://")) return p;

  // backend uploads
  if (p.startsWith("/uploads/")) return `${API_BASE_URL}${p}`;
  if (p.startsWith("uploads/")) return `${API_BASE_URL}/${p}`;

  // frontend public asset
  if (p.startsWith("/")) return p;

  return p;
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

    // keys (for logic) + labels (for UI)
    conditionKey,
    condition: conditionLabel[conditionKey] || "Unknown",

    availabilityKey,
    availability: availabilityLabel[availabilityKey] || "Unknown",

    featured: Boolean(d?.featured),

    // existing schema fields (safe defaults)
    feature: typeof d?.feature === "string" ? d.feature.trim() : "",
    description: typeof d?.description === "string" ? d.description.trim() : "",

    thumbnail: d?.thumbnail || "",
    image: resolveImageUrl(rawImg, "/phone-placeholder.png"),
  };

  base.images = includeImages && Array.isArray(d?.images)
    ? d.images.map((p) =>
        resolveImageUrl(typeof p === "string" ? p : "", "/phone-placeholder.png")
      )
    : [];

  if (includeRaw) base.raw = d;

  return base;
};

export const normalizeSlide = (s) => {
  // Prefer new responsive fields if present
  const rawDesktop =
    s?.imageDesktopUrl ||
    s?.imageDesktop ||
    s?.imageUrl ||
    s?.image ||
    s?.acf?.image ||
    s?.acf?.image_url ||
    s?.url ||
    s?.source_url ||
    s?.guid?.rendered ||
    "";

  const rawMobile =
    s?.imageMobileUrl ||
    s?.imageMobile ||
    "";

  const imageDesktopUrl = resolveImageUrl(rawDesktop, "");
  const imageMobileUrl = resolveImageUrl(rawMobile, "");

  return {
    id: normalizeId(s),

    // legacy (keep existing UI working)
    imageUrl: imageDesktopUrl || resolveImageUrl(rawDesktop, ""),

    // new responsive
    imageDesktopUrl,
    imageMobileUrl,

    title: s?.title || s?.acf?.title || s?.title?.rendered || "",
    subtitle: s?.subtitle || s?.acf?.subtitle || "",
    linkUrl: s?.linkUrl || s?.acf?.link || "",
    raw: s,
  };
};


export const normalizeReview = (r) => {
  return {
    id: normalizeId(r),
    name: r?.name || r?.acf?.name || r?.title?.rendered || "Anonymous",
    email: r?.email || r?.acf?.email || "",
    rating: Number(r?.rating ?? r?.acf?.rating ?? 5),
    content:
      r?.message ||
      r?.content ||
      r?.acf?.content ||
      r?.content?.rendered ||
      "",
    avatarUrl:
      r?.avatar ||
      r?.avatarUrl ||
      r?.acf?.avatar ||
      r?.acf?.avatar_url ||
      "",
    createdAt: r?.createdAt || r?.date || "",
    raw: r,
  };
};
