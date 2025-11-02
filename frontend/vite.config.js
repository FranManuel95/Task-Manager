import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss({
      config: path.resolve(__dirname, "tailwind.config.js"),
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    watch: { usePolling: true },
    proxy: {
      "/api": {
        target: "http://api:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: { port: 8080 },
  build: { outDir: "dist", sourcemap: mode !== "production" },
}));
