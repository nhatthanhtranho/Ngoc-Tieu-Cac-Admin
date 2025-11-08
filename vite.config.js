import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const REPO = "Ngoc-Tieu-Cac-Admin";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "production" ? `/${REPO}/` : "/",
  build: {
    outDir: "dist", // thư mục build
  },
  server: {
    port: 3000, // đổi port dev server
    host: "localhost", // hoặc true nếu muốn expose ra network
  },
}));
