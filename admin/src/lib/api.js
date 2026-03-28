import axios from "axios";
import { API_BASE_URL } from "./constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let didRedirect401 = false;

let csrfToken = null;

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

let csrfPromise = null;

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

// Attach CSRF header for unsafe methods
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

api.interceptors.response.use(
  (res) => {
    // unwrap { ok: true, data: ... } used by admin APIs
    if (
      res?.data &&
      res.data.ok === true &&
      Object.prototype.hasOwnProperty.call(res.data, "data")
    ) {
      res.data = res.data.data;
    }
    return res;
  },
  async (error) => {
    const original = error.config;

    // If CSRF failed (handled by global middleware), status is usually 403.
    // On 401, redirect to admin login if not already there.
    if (error?.response?.status === 401) {
      if (typeof window !== "undefined") {
        const path = window.location?.pathname || "";
        const isLoginPage = path === "/login" || path.startsWith("/login");

        if (!isLoginPage && !didRedirect401) {
          didRedirect401 = true;
          window.location.replace("/login");
        }
      }
      return Promise.reject(normalizeApiError(error));
    }

    return Promise.reject(normalizeApiError(error));
  }
);

export default api;
