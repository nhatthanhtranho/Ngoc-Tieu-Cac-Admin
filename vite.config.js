import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // mode = 'development' khi chạy local
  // mode = 'production' khi build
  return {
    plugins: [react()],
    
    // Base URL cho build
    base: mode === "production" ? "/Ngoc-Tieu-Cac-Admin/" : "/",
    
    server: {
      port: 3000,          // cổng local
      host: "localhost",   // hoặc true nếu muốn expose ra LAN
      historyApiFallback: true, // BrowserRouter reload không lỗi
    },
  };
});
