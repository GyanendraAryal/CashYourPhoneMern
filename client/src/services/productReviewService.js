import api from "../lib/api";

export async function listProductReviews({ productId, status = "approved" } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (productId) params.set("productId", productId);
  const { data } = await api.get(`/api/v1/product-reviews?${params.toString()}`);
  return data;
}

export async function createProductReview({ productId, rating, title, comment }) {
  const { data } = await api.post("/api/v1/product-reviews", {
    productId,
    rating,
    title,
    comment,
  });
  return data;
}
