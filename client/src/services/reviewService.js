import api from "../lib/api";

export const getReviews = (params = {}) => api.get("/api/v1/reviews", { params });

export const createReview = (formData) => {
  // formData can be FormData (avatar upload) or plain object
  const isFormData = typeof FormData !== "undefined" && formData instanceof FormData;
  return api.post("/api/v1/reviews", formData, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};
