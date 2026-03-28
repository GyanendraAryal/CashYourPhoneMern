import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget =
    env.VITE_API_PROXY_TARGET ||
    env.VITE_ADMIN_API_URL ||
    env.VITE_API_URL ||
    "http://localhost:4000";

  return {
    // TailwindCSS is handled via PostCSS (postcss.config.cjs) for this project.
    // No Vite plugin is required.
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
