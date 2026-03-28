import api from "../lib/api";

export async function listAdminNotifications({ unreadOnly = false, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (unreadOnly) params.set("unreadOnly", "1");
  if (limit) params.set("limit", String(limit));
  const { data } = await api.get(`/api/admin/notifications?${params.toString()}`);
  return data;
}

export async function markAdminNotificationRead(id) {
  const { data } = await api.post(`/api/admin/notifications/${id}/read`);
  return data;
}

export async function markAllAdminNotificationsRead() {
  const { data } = await api.post(`/api/admin/notifications/read-all`);
  return data;
}
