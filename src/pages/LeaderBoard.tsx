"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";

import { fetchAllBookSlugs } from "../../apis/books";
import LeaderBoardEdit from "../components/LeaderBoard/LeaderBoardEdit";
import { generateHomePageData } from "../../apis/leaderboard";
import { api } from "../../apis";

type Book = { slug: string; title: string };

// 🔥 Hàm đọc tab từ hash
function getTabFromHash() {
  const hash = window.location.hash;
  const [, queryString] = hash.split("?");
  const params = new URLSearchParams(queryString || "");
  return params.get("tab") || "top_view";
}

export default function LeaderBoard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<string>(getTabFromHash());

  // 👇 loading overlay toàn màn hình
  const [loadingOverlay, setLoadingOverlay] = useState(false);

  useEffect(() => {
    fetchAllBookSlugs((data: Book[]) => setBooks(data));
    document.title = "Bảng Xếp Hạng";
  }, []);

  useEffect(() => {
    const onHashChange = () => setActiveTab(getTabFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // 🔥 Đổi tab + cập nhật hash
  const handleChangeTab = (tab: string) => {
    setActiveTab(tab);

    const hash = window.location.hash;
    const [path, queryString] = hash.split("?");
    const params = new URLSearchParams(queryString || "");
    params.set("tab", tab);

    window.location.hash = `${path}?${params.toString()}`;
  };

  // 🔥 Generate Home Data (có spinner overlay)
  const handleGenerateHomeData = async () => {
    try {
      setLoadingOverlay(true);
      await generateHomePageData();
      toast.success("Generate Home Data thành công!");
    } catch (err) {
      toast.error("Lỗi khi generate Home Data");
    } finally {
      setLoadingOverlay(false);
    }
  };

  const handleGenerateLeaderBoard = async (category: string | null) => {
    if (category === null) {
      toast.error("Category bị null");
    }
    await api.get(`/admin/generate-trending?category=${category}`);
    toast.success("Đã tạo xong bảng xếp hạng tự động");
  };

  const handleGenerateLeaderBoardLatest = async () => {
    await api.get(`/admin/generate-trending-latest`);
    toast.success("Đã tạo xong bảng xếp hạng tự động");
  };

  const handleGenerateLeaderBoardLatestChapter = async () => {
    await api.get(`/admin/generate-trending-latest-chapter`);
    toast.success("Đã tạo xong bảng xếp hạng tự động");
  };

  const handleGenerateLeaderBoardHoanThanh = async () => {
    await api.get(`/admin/generate-trending-hoan-thanh`);
    toast.success("Đã tạo xong bảng xếp hạng tự động");
  };


  const tabs = [
    { key: "top_view", label: "Truyện Xem Nhiều" },
    { key: "top_love", label: "Truyện Yêu Thích" },
    { key: "banners", label: "Truyện Trên Banners" },
    { key: "trending_now", label: "Truyện Xu Hướng" },
    { key: "recommended", label: "Truyện Đề Cử" },
    { key: "latest", label: "Truyện Mới" },
    { key: "latest-chapters", label: "Chương Mới Cập Nhật" },
    { label: "Top Hoàn Thành", key: "hoan-thanh" },

    // Thể loại
    { label: "Top Tiên Hiệp", key: "tien-hiep" },
    { label: "Top Huyền Huyễn", key: "huyen-huyen" },
    { label: "Top Đô Thị", key: "do-thi" },
    { label: "Top Linh Dị", key: "linh-di" },
    { label: "Top Hài Hước", key: "hai-huoc" },
    { label: "Top Hệ Thống", key: "he-thong" },
    { label: "Top Dị Giới", key: "di-gioi" },
    { label: "Top Cơ Trí", key: "co-tri" },
    { label: "Top Trọng Sinh", key: "trong-sinh" },
  ];

  return (
    <div className="container mx-auto pt-8">

      {/* ===========================
          🔥 FULLSCREEN LOADING OVERLAY
      ============================ */}
      {loadingOverlay && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Nút tạo Home Data */}
      <div className="flex justify-end mb-5">
        <button
          onClick={handleGenerateHomeData}
          disabled={loadingOverlay}
          className={`px-4 py-2 rounded shadow cursor-pointer flex items-center gap-2 text-white 
            ${loadingOverlay ? "bg-gray-400 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600"}
          `}
        >
          {loadingOverlay && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          )}
          {loadingOverlay ? "Đang tạo..." : "Tạo Home Data"}
        </button>
      </div>

      {/* Tabs Header */}
      <div className="flex gap-4 overflow-x-auto whitespace-nowrap no-scrollbar border-b border-gray-300 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleChangeTab(tab.key)}
            className={`px-6 py-2 text-sm font-semibold rounded-t-lg transition-all ${activeTab === tab.key
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="mt-4">
        {activeTab === "top_view" && (
          <LeaderBoardEdit
            books={books}
            type="top_view"
            title="Truyện Xem Nhiều"
          />
        )}

        {activeTab === "top_love" && (
          <LeaderBoardEdit
            books={books}
            type="top_love"
            title="Truyện Yêu Thích"
          />
        )}

        {activeTab === "banners" && (
          <LeaderBoardEdit
            books={books}
            type="banners"
            title="Truyện Trên Banners"
          />
        )}

        {activeTab === "trending_now" && (
          <LeaderBoardEdit
            books={books}
            type="trending_now"
            title="Truyện Xu Hướng"
          />
        )}

        {activeTab === "recommended" && (
          <LeaderBoardEdit
            books={books}
            type="recommended"
            title="Truyện Đề Cử"
          />
        )}

        {activeTab === "latest" && (
          <LeaderBoardEdit
            books={books}
            type="latest"
            title="Truyện Mới"
            generate={() => handleGenerateLeaderBoardLatest()}
          />
        )}

        {activeTab === "hoan-thanh" && (
          <LeaderBoardEdit
            books={books}
            type="hoan-thanh"
            title="Truyện Hoàn Thành"
            generate={() => handleGenerateLeaderBoardHoanThanh()}
          />
        )}

        {activeTab === "latest-chapters" && (
          <LeaderBoardEdit
            books={books}
            type="latest"
            title="Chương Mới Cập Nhật"
            generate={() => handleGenerateLeaderBoardLatestChapter()}
          />
        )}

        {activeTab === "limited_free" && (
          <LeaderBoardEdit
            books={books}
            type="limited_free"
            title="Truyện Miễn Phí"
          />
        )}

        {/* --- Thể loại --- */}
        {activeTab === "tien-hiep" && (
          <LeaderBoardEdit
            books={books}
            type="tien-hiep"
            title="Top Tiên Hiệp"
            generate={() => handleGenerateLeaderBoard("tien-hiep")}
          />
        )}

        {activeTab === "huyen-huyen" && (
          <LeaderBoardEdit
            books={books}
            type="huyen-huyen"
            title="Top Huyền Huyễn"
            generate={() => handleGenerateLeaderBoard("huyen-huyen")}
          />
        )}

        {activeTab === "do-thi" && (
          <LeaderBoardEdit
            books={books}
            type="do-thi"
            title="Top Đô Thị"
            generate={() => handleGenerateLeaderBoard("do-thi")}
          />
        )}

        {activeTab === "hai-huoc" && (
          <LeaderBoardEdit
            books={books}
            type="hai-huoc"
            title="Top Hài Hước"
            generate={() => handleGenerateLeaderBoard("hai-huoc")}
          />
        )}

        {activeTab === "he-thong" && (
          <LeaderBoardEdit
            books={books}
            type="he-thong"
            title="Top Hệ Thống"
            generate={() => handleGenerateLeaderBoard("he-thong")}
          />
        )}

        {activeTab === "di-gioi" && (
          <LeaderBoardEdit
            books={books}
            type="di-gioi"
            title="Top Dị Giới"
            generate={() => handleGenerateLeaderBoard("di-gioi")}
          />
        )}

        {activeTab === "co-tri" && (
          <LeaderBoardEdit
            books={books}
            type="co-tri"
            title="Top Cơ Trí"
            generate={() => handleGenerateLeaderBoard("co-tri")}
          />
        )}

        {activeTab === "trong-sinh" && (
          <LeaderBoardEdit
            books={books}
            type="trong-sinh"
            title="Top Trọng Sinh"
            generate={() => handleGenerateLeaderBoard("trong-sinh")}
          />
        )}

        {activeTab === "linh-di" && (
          <LeaderBoardEdit
            books={books}
            type="linh-di"
            title="Top Linh Dị"
            generate={() => handleGenerateLeaderBoard("linh-di")}
          />
        )}

      </div>
    </div>
  );
}
