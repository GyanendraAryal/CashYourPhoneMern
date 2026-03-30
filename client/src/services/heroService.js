import api  from "../lib/api";

/**
 * Fetch hero slides
 * Backend: GET /api/heroslides
 */
export const getHeroSlides = (params = {}) => {
  return api.get("/api/v1/hero-slides", { params });
};