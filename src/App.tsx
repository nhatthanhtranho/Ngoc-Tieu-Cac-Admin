"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import LoginModal from "./components/Modal/LoginModal";
import { ToastContainer } from "react-toastify";
import { useAuthState } from "./stores/auth.store";
import {
  Home as HomeIcon,
  Crown,
  PlusSquare,
  Coins,
  LogOut,
  ChartAreaIcon,
  IdCard,
} from "lucide-react";
import { api } from "../apis";
import Badge from "./components/Badge";

// Dynamic imports
const Home = lazy(() => import("./pages/Home"));
const BookDetail = lazy(() => import("./pages/BookDetail"));
const ChapterDetailPage = lazy(() => import("./pages/ChapterDetail"));
const LeaderBoard = lazy(() => import("./pages/LeaderBoard"));
const ThongKe = lazy(() => import("./pages/ThongKe"));
const TopUp = lazy(() => import("./pages/TopUp"));

export default function App() {
  const { accessToken, user, logout } = useAuthState();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0); // ✅ state badge
  const location = useLocation();

  const handleLogOut = () => logout();

  useEffect(() => {
    setIsLoggedIn(!!accessToken && !!user);
  }, [accessToken, user]);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await api.get("/payment-requests/count-pending");
        setPendingCount(res.data.count || 0); // axios trả data trong res.data
      } catch (err) {
        console.error("Failed to fetch pending count", err);
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000); // refresh mỗi 30s
    return () => clearInterval(interval);
  }, []);

  const hideSidebar = location.pathname.includes("/chapter/");

  return (
    <>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        pauseOnHover
        draggable
        theme="dark"
      />

      <div className="flex h-screen">
        {/* Sidebar */}
        {!hideSidebar && (
          <aside className="lg:w-64 bg-zinc-900 text-white flex flex-col justify-between">
            <div>
              <div className="p-6 border-b border-zinc-800">
                <h1 className="text-xl font-bold tracking-wide">
                  Ngọc Tiêu Các
                </h1>
              </div>

              <nav className="flex flex-col p-4 space-y-2">
                <NavItem
                  to="/"
                  icon={<HomeIcon size={20} />}
                  label="Trang chủ"
                />
                <NavItem
                  to="/leaderboard"
                  icon={<Crown size={20} />}
                  label="Bảng Xếp Hạng"
                />
                <NavItem
                  to="/thong-ke"
                  icon={<ChartAreaIcon size={20} />}
                  label="Thống kê"
                />
                <NavItem
                  to="/top-up"
                  icon={<Coins size={20} />}
                  label="Top Up"
                  badge={pendingCount}
                />
                {/* ✅ thêm badge */}
                <NavItem
                  to="/membership"
                  icon={<IdCard size={20} />}
                  label="Membership"
                  badge={pendingCount}
                />
                {/* ✅ thêm badge */}
              </nav>
            </div>

            {user && (
              <div className="border-t border-zinc-800 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src="https://i.pinimg.com/736x/ff/fd/56/fffd5664e397cec39620169f8b5ee606.jpg"
                    alt="avatar"
                    className="w-10 h-10 rounded-full border border-white"
                  />
                  <div>
                    <p className="font-semibold text-sm">{user.displayName}</p>
                    <p className="text-xs text-gray-400">Đang hoạt động</p>
                  </div>
                </div>
                <button
                  onClick={handleLogOut}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 bg-zinc-50 overflow-y-auto">
          <div className={isLoggedIn ? "" : "filter blur-sm"}>
            <Suspense fallback={<div className="p-4">Đang tải...</div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/leaderboard" element={<LeaderBoard />} />
                <Route path="/thong-ke" element={<ThongKe />} />
                <Route path="/top-up" element={<TopUp />} />
                <Route path="/book/:slug" element={<BookDetail />} />
                <Route
                  path="/book/:slug/chapter/:chapterNumber"
                  element={<ChapterDetailPage />}
                />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>

      {!isLoggedIn && <LoginModal onLoginSuccess={() => setIsLoggedIn(true)} />}
    </>
  );
}

// NavItem component
function NavItem({
  to,
  icon,
  label,
  badge,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
        isActive
          ? "bg-blue-600 text-white shadow-md"
          : "text-gray-300 hover:bg-zinc-800 hover:text-white"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>

      {badge !== undefined && <Badge count={badge} max={99} />}
    </Link>
  );
}
