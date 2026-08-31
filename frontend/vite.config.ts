import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Local-only dev server: binds 127.0.0.1 and proxies /api to the Flask
// backend (backend/desktop.py) so the SPA works with no VITE_BACKEND_URL.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_"],
  test: {
    css: { include: [/\.css/] },
  },
  server: {
    port: 3000,
    host: "127.0.0.1",
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: false,
      },
    },
  },
  build: {
    target: "chrome105",
    sourcemap: false,
  },
});
