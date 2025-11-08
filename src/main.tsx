import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

const repoName = "Ngoc-Tieu-Cac-Admin"; // 👈 đổi thành tên repo GitHub của bạn

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter basename={`/${repoName}`}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
