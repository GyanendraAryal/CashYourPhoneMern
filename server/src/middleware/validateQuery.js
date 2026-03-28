export const validateDeviceQuery = (req, res, next) => {
  const {
    condition,
    availability,
    page,
    limit,
    featured,
    q,
    brand,
    minPrice,
    maxPrice,
    sort,
  } = req.query;

  const allowedConditions = ["new", "like_new", "pre_owned", "refurbished"];
  const allowedAvailability = ["in_stock", "out_of_stock", "coming_soon"];

  // Validate & normalize condition param (support spaces/hyphens from UI)
  if (condition) {
    const normalized = String(condition).toLowerCase().replace(/\s|-/g, "_");
    if (!allowedConditions.includes(normalized)) {
      return res.status(400).json({
        success: false,
        message: `Invalid condition value: ${condition}`,
      });
    }
    req.query.condition = normalized;
  }

  // Validate & normalize availability param
  if (availability) {
    const normalized = String(availability).toLowerCase().replace(/\s|-/g, "_");
    if (!allowedAvailability.includes(normalized)) {
      return res.status(400).json({
        success: false,
        message: `Invalid availability value: ${availability}`,
      });
    }
    req.query.availability = normalized;
  }

  // Validate pagination params
  if (page && (isNaN(page) || Number(page) < 1)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid page number" });
  }
  if (limit && (isNaN(limit) || Number(limit) < 1)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid limit value" });
  }

  // Validate featured flag
  if (featured !== undefined && !["true", "false"].includes(String(featured).toLowerCase())) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid featured flag" });
  }

  // Guardrails for search inputs
  if (q !== undefined) {
    const s = String(q);
    if (s.length > 80) {
      return res
        .status(400)
        .json({ success: false, message: "Query too long (max 80 chars)" });
    }
  }

  if (brand !== undefined) {
    const s = String(brand);
    if (s.length > 40) {
      return res
        .status(400)
        .json({ success: false, message: "Brand too long (max 40 chars)" });
    }
  }

  if (minPrice !== undefined && (isNaN(minPrice) || Number(minPrice) < 0)) {
    return res.status(400).json({ success: false, message: "Invalid minPrice" });
  }
  if (maxPrice !== undefined && (isNaN(maxPrice) || Number(maxPrice) < 0)) {
    return res.status(400).json({ success: false, message: "Invalid maxPrice" });
  }

  // Validate sort option (used by search endpoint)
  if (sort !== undefined) {
    const allowedSort = ["relevance", "newest", "price_asc", "price_desc"];
    if (!allowedSort.includes(String(sort))) {
      return res.status(400).json({ success: false, message: "Invalid sort" });
    }
  }

  next();
};
