// client/src/lib/api.js
import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let csrfToken = null;
let csrfPromise = null;

function normalizeApiError(err) {
  const msg =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Something went wrong. Please try again.";
  const e = new Error(String(msg));
  e.status = err?.response?.status;
  e.data = err?.response?.data;
  return e;
}

async function getCsrfToken() {
  if (csrfToken) return csrfToken;

  if (!csrfPromise) {
    csrfPromise = api
      .get("/api/v1/csrf")
      .then((res) => {
        csrfToken = res.data?.csrfToken || null;
        return csrfToken;
      })
      .finally(() => {
        csrfPromise = null;
      });
  }

  return csrfPromise;
}

// Request interceptor: attach CSRF header for unsafe methods
api.interceptors.request.use(async (config) => {
  const method = (config.method || "GET").toUpperCase();
  const unsafe = ["POST", "PUT", "PATCH", "DELETE"];

  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (!isFormData) {
    config.headers = config.headers || {};
    config.headers["Content-Type"] = "application/json";
  }

  if (unsafe.includes(method)) {
    const token = await getCsrfToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers["x-csrf-token"] = token;
    }
  }

  return config;
});

let isRefreshing = false;
let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // ✅ CSRF 403: refresh CSRF token once and retry
    if (error?.response?.status === 403 && original && !original._csrfRetry) {
      const msg = String(error?.response?.data?.message || "").toLowerCase();
      const looksCsrf =
        msg.includes("csrf") ||
        msg.includes("token") ||
        error?.response?.data?.code === "CSRF";

      if (looksCsrf) {
        original._csrfRetry = true;
        csrfToken = null;
        await getCsrfToken();
        return api(original);
      }
    }

    // ✅ Auto refresh on 401 once, then retry original request
    if (!error?.response || error.response.status !== 401) {
      return Promise.reject(normalizeApiError(error));
    }

    const url = original?.url || "";
    const isAuthCall =
      url.includes("/api/v1/user/login") ||
      url.includes("/api/v1/user/register") ||
      url.includes("/api/v1/user/refresh") ||
      url.includes("/api/v1/user/logout");

    if (isAuthCall) return Promise.reject(normalizeApiError(error));
    if (!original || original._retry) return Promise.reject(normalizeApiError(error));

    original._retry = true;

    try {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = api.post("/api/v1/user/refresh");
      }

      await refreshPromise;
      return api(original);
    } catch (e) {
      return Promise.reject(normalizeApiError(e));
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  }
);

export default api;
