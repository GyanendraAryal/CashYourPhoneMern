import api  from "../lib/api";

/**
 * Normalize condition strings (e.g. "Like New" -> "like_new")
 */
const normalizeCondition = (label) =>
  typeof label === "string"
    ? label.toLowerCase().replace(/\s|-/g, "_")
    : label;

/**
 * Build query params safely
 */
const buildParams = (options = {}) => {
  const {
    q,
    brand,
    minPrice,
    maxPrice,
    availability,
    condition,
    featured,
    page = 1,
    limit = 20,
    sort,
  } = options;

  const params = {};

  if (q) params.q = q;
  if (brand) params.brand = brand;
  if (minPrice !== undefined && minPrice !== "") params.minPrice = minPrice;
  if (maxPrice !== undefined && maxPrice !== "") params.maxPrice = maxPrice;
  if (availability) params.availability = availability;
  if (condition) params.condition = normalizeCondition(condition);
  if (featured !== undefined) params.featured = featured;
  if (page) params.page = page;
  if (limit) params.limit = limit;
  if (sort) params.sort = sort;

  return params;
};

/**
 * GET /api/devices
 */
export const getDevices = async (options = {}) => {
  try {
    const params = buildParams(options);

    const res = await api.get("/api/v1/devices", { params });

    return res; // ✅ let hook extract .data
  } catch (error) {
    console.error("Error fetching devices:", error);

    throw new Error(
      error?.response?.data?.message || "Failed to fetch devices"
    );
  }
};

/**
 * GET /api/devices/:id
 */
export const getDeviceById = async (id) => {
  try {
    const res = await api.get(`/api/v1/devices/${id}`);
    return res; // ✅ consistent
  } catch (error) {
    console.error(`Error fetching device ${id}:`, error);

    throw new Error(
      error?.response?.data?.message || "Failed to fetch device"
    );
  }
};

/**
 * GET /api/devices/:id/recommendations
 */
export const getRecommendations = async (id) => {
  try {
    const res = await api.get(`/api/v1/devices/${id}/recommendations`);
    return res; // ✅ consistent
  } catch (error) {
    console.error(`Error fetching recommendations for ${id}:`, error);

    throw new Error(
      error?.response?.data?.message || "Failed to fetch recommendations"
    );
  }
};