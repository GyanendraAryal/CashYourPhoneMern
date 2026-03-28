import api from "../lib/api";

export const getOrders = (params = {}) =>
  api.get("/api/admin/orders", { params });

export const getOrder = (id) =>
  api.get(`/api/admin/orders/${id}`);

export const updateOrderStatus = (id, status) =>
  api.patch(`/api/admin/orders/${id}/status`, { status });