// src/lib/upload.js
// FRONTEND helper (Admin UI): upload a single file via the admin upload endpoint.

import api from "./api";

export const uploadSingle = async (file) => {
  const form = new FormData();
  form.append("file", file);

  const res = await api.post("/api/admin/upload/single", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data?.url || "";
};
