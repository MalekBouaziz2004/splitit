import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  build: {
    // Keep the existing index.html outside the React build until cutover.
    rolldownOptions: {
      input: fileURLToPath(new URL("./react.html", import.meta.url)),
    },
  },
});
