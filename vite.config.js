import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// CPAS API host. Only used on the Node side: in dev the browser calls
// /cpas-api and the dev server proxies it, so the real host never reaches
// the browser. Production builds inject the full URL at build time.
const CPAS_API_TARGET = "https://cpasapi.access-armpensions.com";
const CPAS_PROXY_PATH = "/cpas-api";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  define: {
    __CPAS_API_URL__: JSON.stringify(
      command === "build" ? `${CPAS_API_TARGET}/api` : CPAS_PROXY_PATH,
    ),
  },
  server: {
    proxy: {
      [CPAS_PROXY_PATH]: {
        target: CPAS_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cpas-api/, "/api"),
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          toast: ["react-hot-toast"],
          router: ["react-router-dom"],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // optional
  },
}));
