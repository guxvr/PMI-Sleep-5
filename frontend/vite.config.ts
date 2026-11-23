import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        timeout: 130000,
        proxyTimeout: 130000,
      },
    },
  },
  preview: {
    proxy: { "/api": { target: "http://127.0.0.1:3001", changeOrigin: true } },
  },
});
