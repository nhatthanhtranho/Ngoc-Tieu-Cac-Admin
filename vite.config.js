import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // 👈 đổi cổng ở đây
    host: "localhost", // hoặc true để expose ra mạng LAN
    historyApiFallback: true, // 👈 Đảm bảo BrowserRouter reload không lỗi
  },
});
