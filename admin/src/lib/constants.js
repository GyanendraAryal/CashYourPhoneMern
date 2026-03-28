const API =
  import.meta.env.VITE_ADMIN_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL;

if (import.meta.env.PROD && !API) {
  throw new Error(
    "Missing Admin API base URL. Set VITE_ADMIN_API_URL (or VITE_API_URL / VITE_API_BASE_URL)."
  );
}

export const API_BASE_URL = API || "http://localhost:4000";
