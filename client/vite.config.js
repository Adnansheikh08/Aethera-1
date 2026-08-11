import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The SPA talks to the Express API, which listens on config.port (default 5000,
// see server/src/config/index.js). In dev, Vite proxies /api so the browser uses
// the same origin for the httpOnly refresh-token cookie — SameSite=Strict would
// otherwise reject it on a second origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:5000",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
