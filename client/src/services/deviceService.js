import api from "../lib/api";

/**
 * Normalize condition strings (e.g. "Like New" -> "like_new")
 */
const normalizeCondition = (label) =>
  typeof label === "string" ? label.toLowerCase().replace(/\s|-/g, "_") : label;

/**
 * Fetch a paginated list of devices with optional filters + search
 *
 * @param {Object} options
 * @param {string} [options.q] - Search query
 * @param {string} [options.brand] - Brand filter
 * @param {number|string} [options.minPrice] - Min price
 * @param {number|string} [options.maxPrice] - Max price
 * @param {string} [options.availability] - Availability filter
 * @param {string} [options.condition] - Device condition filter
 * @param {boolean} [options.featured] - Featured devices only
 * @param {number} [options.page=1] - Current page
 * @param {number} [options.limit=20] - Results per page
 * @param {string} [options.sort] - Sort option ("relevance" | "newest" | "price_asc" | "price_desc")
 */
export const getDevices = async (options = {}) => {
  try {
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
    // `enabled` is only for React Query — never sent as a query param

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

    const response = await api.get("/api/v1/devices", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching devices:", error);
    throw error.response?.data || error;
  }
};

/**
 * Fetch a single device by ID
 *
 * @param {string} id - Device MongoDB ObjectId
 */
export const getDeviceById = async (id) => {
  try {
    const response = await api.get(`/api/v1/devices/${id}`);
    return response.data; // ✅ payload (e.g. { success: true, data: device })
  } catch (error) {
    console.error(`Error fetching device ${id}:`, error);
    throw error.response?.data || error;
  }
};
/**
 * Fetch similar device recommendations for a specific device
 *
 * @param {string} id - Current device ID
 */
export const getRecommendations = async (id) => {
  try {
    const response = await api.get(`/api/v1/devices/${id}/recommendations`);
    return response.data; // { status: "success", data: [...] }
  } catch (error) {
    console.error(`Error fetching recommendations for ${id}:`, error);
    throw error.response?.data || error;
  }
};
