import api from "../lib/api";

export const getHeroSlides = (params = {}) => api.get("/api/v1/hero-slides", { params });
