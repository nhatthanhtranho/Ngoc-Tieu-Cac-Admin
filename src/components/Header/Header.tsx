/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Crown,
  LogOut,
  Menu,
  X,
  Coins,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAllCategories } from "@/apis/categories";
import { useAuthStore } from "@/store/auth.store";
import { useModalStore } from "@/store/modal.store"


interface Category {
  label: string;
  value: string;
}

const Header = () => {
  const headerRef = useRef<HTMLElement>(null);
  const { user, fetchUser, logout } = useAuthStore();
  const {
    isDropdownOpen,
    toggleDropdown,
    closeDropdown,
    openLogin,
  } = useModalStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [hasBackground, setHasBackground] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchAllCategories(setCategories);
        await fetchUser();
      } catch (err) {
        console.error("⚠️ Lỗi fetch dữ liệu Header:", err);
        setCategories([]);
      }
    };
    fetchData();
  }, [fetchUser]);

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        setHasBackground(window.scrollY > headerRef.current.offsetHeight);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const avatarSrc =
    user?.avatar && typeof user.avatar === "string"
      ? user.avatar
      : "/default_avatar.jpg";

  return (
    <>
      <header
        ref={headerRef}
        className={`md:fixed top-0 left-0 right-0 z-[60] py-1 md:py-4 transition-colors duration-300 ${hasBackground ? "bg-[#0b0b0d]/95 backdrop-blur-md" : "bg-transparent"
          } text-gray-50`}
      >
        <div className="flex items-center justify-between container mx-auto px-4">
          {/* Logo */}
          <Link href={"/"}>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold font-playfair cursor-pointer text-emerald-300 drop-shadow-[0_0_8px_#00ffa2] whitespace-nowrap">
              Ngọc Tiêu Các
            </h2>
          </Link>

          {/* Desktop Nav */}
        

          {/* User section */}
          <div className="hidden md:flex gap-3 items-center ml-auto">


            {user ? (
              <>
                {/* Avatar + Menu */}
                <div
                  className="relative group cursor-pointer"
                  onMouseEnter={() => setOpenMenu(true)}
                  onMouseLeave={() => setOpenMenu(false)}
                >
                  <div className="relative w-9 h-9 md:w-11 md:h-11">
                    <img
                      src={avatarSrc}
                      alt="avatar"
                      className={`w-full h-full rounded-full object-cover shadow-md ${user.isPremium ? "ring-[3px] ring-yellow-400" : ""
                        }`}
                    />
                    {user.isPremium && (
                      <div className="absolute bottom-0 right-0 bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-full p-[2px] shadow-md">
                        <Crown
                          className="w-3 h-3 md:w-3.5 md:h-3.5 text-black drop-shadow-[0_0_3px_#facc15]"
                          strokeWidth={2}
                        />
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {openMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-12 bg-[#1a1a1d] border border-emerald-800/40 rounded-xl shadow-xl p-3 md:p-4 w-56 md:w-64 z-50 text-sm md:text-base"
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="relative">
                            <img
                              src={avatarSrc}
                              alt="avatar"
                              className={`w-14 h-14 md:w-16 md:h-16 rounded-full object-cover mb-2 ${user.isPremium ? "ring-[3px] ring-yellow-400" : ""
                                }`}
                            />
                            {user.isPremium && (
                              <div className="absolute bottom-1 right-1 bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-full p-[3px] shadow-lg">
                                <Crown className="w-4 h-4 text-black" strokeWidth={2} />
                              </div>
                            )}
                          </div>

                          <p className="text-emerald-300 font-semibold text-base">
                            {user.displayName ?? "Ẩn danh"}
                          </p>



                          <p className="text-gray-400 text-xs md:text-sm mb-3">
                            {user.email ?? "Không có email"}
                          </p>

                          <div className="flex items-center justify-center gap-2 bg-emerald-700/30 border border-emerald-600/40 rounded-full px-2 md:px-3 py-1 mb-2 text-xs md:text-sm">
                            <Coins className="w-4 h-4 text-emerald-300" />
                            <span className="text-emerald-200">
                              {user?.tienNgoc?.toLocaleString?.() ?? "0"} Tiên Ngọc
                            </span>
                          </div>

                          <Link
                            href="/profile"
                            className="text-emerald-400 hover:text-emerald-300 mb-2 text-xs md:text-sm"
                          >
                            Hồ sơ cá nhân
                          </Link>
                          <button
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 py-1.5 text-xs md:text-sm rounded-md text-red-400 hover:bg-red-400/10 transition-colors"
                          >
                            <LogOut size={14} /> Đăng xuất
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <button
                onClick={openLogin}
                className="cursor-pointer bg-emerald-400/90 hover:bg-emerald-500 rounded-full px-4 md:px-6 py-1.5 md:py-2 shadow-lg text-xs md:text-sm font-bold transition-colors flex items-center gap-2"
              >
                Đăng Nhập
              </button>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden text-gray-100 p-2"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </header>

    </>
  );
};

export default Header;
