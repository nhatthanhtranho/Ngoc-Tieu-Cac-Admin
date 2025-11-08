import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import BookDetail from "./pages/BookDetail";
import ChapterDetailPage from "./pages/ChapterDetail";
import LeaderBoard from "./pages/LeaderBoard";
import CreateBook from "./pages/CreateBook";
import NapTienNgoc from "./pages/NapTienNgoc";
import TopUp from "./pages/TopUp";
import LoginModal from "./components/Modal/LoginModal";
import { ToastContainer } from "react-toastify";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);
  }, []);

  return (
    <>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="dark"
      />
      {/* Background + App content */}
      <div className={isLoggedIn ? "" : "filter blur-sm"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/leaderboard" element={<LeaderBoard />} />
          <Route path="/nap-tien-ngoc" element={<NapTienNgoc />} />
          <Route path="/top-up" element={<TopUp />} />
          <Route path="/create-book" element={<CreateBook />} />
          <Route path="/book/:slug" element={<BookDetail />} />
          <Route
            path="/book/:slug/chapter/:chapterNumber"
            element={<ChapterDetailPage />}
          />
        </Routes>
      </div>

      {/* Modal login luôn fixed top-level, không bị blur */}
      {!isLoggedIn && <LoginModal onLoginSuccess={() => setIsLoggedIn(true)} />}
    </>
  );
}
