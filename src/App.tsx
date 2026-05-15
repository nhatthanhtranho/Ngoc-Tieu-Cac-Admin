"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import LoginModal from "./components/Modal/LoginModal";
import { ToastContainer } from "react-toastify";
import { useAuthState } from "./stores/auth.store";
import {
  Home as HomeIcon,
  Crown,
  Coins,
  LogOut,
  ChartAreaIcon,
  IdCard,
  Music2,
  TableConfig,
  SquareUserRound,
  MessageCircle,
  CircleDollarSign,
  LibraryBig,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Badge from "./components/Badge";
import LeaderBoardAudio from "./pages/LeaderBoardAudio";
import Variable from "./pages/Variable";
import DichGia from "./pages/DichGia";
import CommentList from "./pages/Comments";
import NapTien from "./pages/NapTien";
import UserEbook from "./pages/UserEbook";
import axios from "axios";
import { BACKEND_URL } from "./constant";

// Dynamic imports
const Home = lazy(() => import("./pages/Home"));
const BookDetail = lazy(() => import("./pages/BookDetail"));
const LeaderBoard = lazy(() => import("./pages/LeaderBoard"));
const ThongKe = lazy(() => import("./pages/ThongKe"));
const TopUp = lazy(() => import("./pages/TopUp"));

export default function App() {
  const { accessToken, user, logout } = useAuthState();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const [pendingCount, setPendingCount] = useState<{
    membership: number;
    topup: number;
  }>({
    membership: 0,
    topup: 0,
  });

  const location = useLocation();

  const handleLogOut = () => logout();

  useEffect(() => {
    setIsLoggedIn(!!accessToken && !!user);
  }, [accessToken, user]);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/payment-requests`);
        setPendingCount(res.data);
      } catch (err) {
        console.error("Failed to fetch pending count", err);
      }
    };

    fetchPendingCount();

    const interval = setInterval(fetchPendingCount, 30000);

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
          <aside
            className={`relative bg-zinc-900 text-white flex flex-col justify-between transition-all duration-300 border-r border-zinc-800 ${
              collapsed ? "w-20" : "w-64"
            }`}
          >
            {/* Toggle button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="absolute -right-3 top-6 z-50 bg-zinc-800 border border-zinc-700 rounded-full p-1 hover:bg-zinc-700 transition"
            >
              {collapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </button>

            <div>
              {/* Logo */}
              <div className="p-6 border-b border-zinc-800">
                <h1
                  className={`font-bold tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${
                    collapsed ? "text-center text-sm" : "text-xl"
                  }`}
                >
                  {collapsed ? "NTG" : "Ngọc Tiêu Các"}
                </h1>
              </div>

              {/* Nav */}
              <nav className="flex flex-col p-4 space-y-2">
                <NavItem
                  collapsed={collapsed}
                  to="/"
                  icon={<HomeIcon size={20} />}
                  label="Trang chủ"
                />

                <NavItem
                  collapsed={collapsed}
                  to="/dich-gia"
                  icon={<SquareUserRound size={20} />}
                  label="Dịch giả"
                />

                <NavItem
                  collapsed={collapsed}
                  to="/variable"
                  icon={<TableConfig size={20} />}
                  label="Biến Môi Trường"
                />

                <NavItem
                  collapsed={collapsed}
                  to="/leaderboard"
                  icon={<Crown size={20} />}
                  label="Bảng Xếp Hạng"
                />

                <NavItem
                  collapsed={collapsed}
                  to="/leaderboard-audio"
                  icon={<Music2 size={20} />}
                  label="BXH Audio"
                />

                <NavItem
                  collapsed={collapsed}
                  to="/thong-ke"
                  icon={<ChartAreaIcon size={20} />}
                  label="Thống kê"
                />

                <NavItem
                  collapsed={collapsed}
                  to="/comments"
                  icon={<MessageCircle size={20} />}
                  label="Bình luận"
                />

                <NavItem
                  collapsed={collapsed}
                  to="/top-up"
                  icon={<Coins size={20} />}
                  label="Top Up"
                  badge={pendingCount.topup}
                />

                <NavItem
                  collapsed={collapsed}
                  to="/membership"
                  icon={<IdCard size={20} />}
                  label="Membership"
                  badge={pendingCount.membership}
                />

                <NavItem
                  collapsed={collapsed}
                  to="/ebook-da-mua"
                  icon={<LibraryBig size={20} />}
                  label="Epub"
                />

                <NavItem
                  collapsed={collapsed}
                  to="/nap-tien"
                  icon={<CircleDollarSign size={20} />}
                  label="Nạp tiền"
                />
              </nav>
            </div>

            {/* User */}
            {user && (
              <div
                className={`border-t border-zinc-800 p-4 flex items-center ${
                  collapsed ? "justify-center" : "justify-between"
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <img
                    src="https://i.pinimg.com/736x/ff/fd/56/fffd5664e397cec39620169f8b5ee606.jpg"
                    alt="avatar"
                    className="w-10 h-10 rounded-full border border-white shrink-0"
                  />

                  {!collapsed && (
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-gray-400">
                        Đang hoạt động
                      </p>
                    </div>
                  )}
                </div>

                {!collapsed && (
                  <button
                    onClick={handleLogOut}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <LogOut size={18} />
                  </button>
                )}
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
                <Route
                  path="/leaderboard-audio"
                  element={<LeaderBoardAudio />}
                />
                <Route path="/variable" element={<Variable />} />
                <Route path="/dich-gia" element={<DichGia />} />
                <Route path="/thong-ke" element={<ThongKe />} />
                <Route path="/top-up" element={<TopUp topUpType="topup" />} />
                <Route path="/comments" element={<CommentList />} />
                <Route path="/nap-tien" element={<NapTien />} />
                <Route path="/ebook-da-mua" element={<UserEbook />} />
                <Route
                  path="/membership"
                  element={<TopUp topUpType="membership" />}
                />

                <Route path="/book/:slug" element={<BookDetail />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>

      {!isLoggedIn && (
        <LoginModal onLoginSuccess={() => setIsLoggedIn(true)} />
      )}
    </>
  );
}

// NavItem component
function NavItem({
  to,
  icon,
  label,
  badge,
  collapsed,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  collapsed?: boolean;
}) {
  const location = useLocation();

  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      title={collapsed ? label : ""}
      className={`relative flex items-center rounded-lg transition-all group ${
        collapsed
          ? "justify-center px-2 py-3"
          : "gap-3 px-3 py-2"
      } ${
        isActive
          ? "bg-blue-600 text-white shadow-md"
          : "text-gray-300 hover:bg-zinc-800 hover:text-white"
      }`}
    >
      {icon}

      {!collapsed && (
        <span className="text-sm font-medium whitespace-nowrap">
          {label}
        </span>
      )}

      {badge !== undefined && <Badge count={badge} max={99} />}
    </Link>
  );
}