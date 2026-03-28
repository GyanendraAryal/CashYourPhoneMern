async function requestJson(path, { method = "GET", body } = {}) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // REQUIRED for admin cookie auth
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function adminListUsers({ q = "", page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", String(page));
  params.set("limit", String(limit));

  return requestJson(`/api/admin/users?${params.toString()}`);
}

export async function adminGetUser(id) {
  if (!id) throw new Error("User id is required");
  return requestJson(`/api/admin/users/${encodeURIComponent(id)}`);
}
