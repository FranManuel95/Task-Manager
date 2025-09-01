import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')  // 👈 alias para imports como "@/types"
    },
  },
  server: {
    host: true,
    port: 5174,
    watch: {
      usePolling: true,
      strictPort: true,
    },
    proxy: {
    '/api': {
    target: 'http://api:4000', // nombre del servicio en docker-compose
    changeOrigin: true,
    rewrite: (path) => path,
    },
    },
    preview: { port: 8080 },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
  },
});



