import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import BookDetail from "./pages/BookDetail";
import ChapterDetailPage from "./pages/ChapterDetail";
import LeaderBoard from "./pages/LeaderBoard";
import CreateBook from "./pages/CreateBook";
import NapTienNgoc from "./pages/NapTienNgoc";
import TopUp from "./pages/TopUp";
import LoginModal from "./components/Modal/LoginModal";
import { ToastContainer } from "react-toastify";
import { useAuthState } from "./stores/auth.store";

export default function App() {
  const { accessToken, user, logout } = useAuthState();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation(); // <--- thêm

  const handleLogOut = () => {
    logout();
  };

  useEffect(() => {
    setIsLoggedIn(!!accessToken && !!user);
  }, [accessToken, user]);

  // Kiểm tra nếu đang ở trang chapter, không show header
  const hideHeader = location.pathname.includes("/chapter/");

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

      {/* Header */}
      {!hideHeader && (
        <div
          className={`container mx-auto flex justify-end items-center py-4 relative ${
            user == null ? "hidden" : ""
          }`}
        >
          <h2 className="text-lg mr-3">Xin chào, {user?.displayName}</h2>
          <div className="relative group">
            <img
              className="w-13 h-13 rounded-full border-2 border-white shadow-sm cursor-pointer"
              src="https://i.pinimg.com/736x/ff/fd/56/fffd5664e397cec39620169f8b5ee606.jpg"
              alt="User Avatar"
            />

            <button
              onClick={() => handleLogOut()}
              className="absolute w-32 right-0 mt-2 py-2 cursor-pointer hover:bg-zinc-900 bg-zinc-800 text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Log out
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
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

      {/* Modal login */}
      {!isLoggedIn && <LoginModal onLoginSuccess={() => setIsLoggedIn(true)} />}
    </>
  );
}
