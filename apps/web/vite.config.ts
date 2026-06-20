import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Split the heaviest third-party libraries into their own long-lived,
        // cacheable chunks so the main app bundle shrinks and a dependency
        // bump doesn't bust the whole app's cache. Everything else falls
        // through to Vite's default chunking.
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;
          if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-vector"))
            return "vendor-charts";
          if (id.includes("socket.io") || id.includes("engine.io"))
            return "vendor-realtime";
        },
      },
    },
  },
});