// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

// __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    watch: {
      usePolling: true, // mejor detección de cambios en Docker/WSL2/Mac
    },
    proxy: {
      "/api": {
        target: "http://api:4000", // servicio del compose
        changeOrigin: true,
        // "rewrite" no es necesario si no cambias el path base
        // secure: false // solo si tu backend fuese HTTPS con cert autogenerado
      },
    },
    // Si alguna vez usas proxy inverso y HMR no conecta, descomenta:
    // hmr: { clientPort: 5174 },
  },
  preview: {
    port: 8080,
  },
  build: {
    outDir: "dist",
    sourcemap: mode !== "production",
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
  },
}));
