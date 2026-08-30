import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
});
