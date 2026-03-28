import api from "../lib/api";

export const createSellRequest = (formData) => {
  const isFormData = typeof FormData !== "undefined" && formData instanceof FormData;
  return api.post("/api/v1/sell-requests", formData, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};
