import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./global.css";

// Lấy giá trị basename từ biến môi trường, ví dụ VITE_ENVIRONMENT
const basename = import.meta.env.VITE_ENVIRONMENT === "production"
  ? "/Ngoc-Tieu-Cac-Admin"
  : "/";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
