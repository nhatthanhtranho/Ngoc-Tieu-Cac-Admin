"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";

import { fetchAllBookSlugs } from "../../apis/books";
import LeaderBoardEdit from "../components/LeaderBoard/LeaderBoardEdit";
import { generateHomePageData } from "../../apis/leaderboard";

type Book = { slug: string; title: string };

// 🔥 Hàm đọc tab từ hash
function getTabFromHash() {
  // Ví dụ hash: "#/leaderboard?tab=top_view"
  const hash = window.location.hash;
  const [, queryString] = hash.split("?");

  const params = new URLSearchParams(queryString || "");
  return params.get("tab") || "top_view";
}

export default function LeaderBoard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<string>(getTabFromHash());

  useEffect(() => {
    fetchAllBookSlugs((data: Book[]) => setBooks(data));
    document.title = "Bảng Xếp Hạng";
  }, []);

  // 🔥 Lắng nghe khi URL hash thay đổi (vd: user refresh, back/forward)
  useEffect(() => {
    const onHashChange = () => setActiveTab(getTabFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // 🔥 Đổi tab + cập nhật hash đúng format
  const handleChangeTab = (tab: string) => {
    setActiveTab(tab);

    const hash = window.location.hash; // "#/leaderboard?x=y"
    const [path, queryString] = hash.split("?");

    const params = new URLSearchParams(queryString || "");
    params.set("tab", tab);

    const newHash = `${path}?${params.toString()}`;

    window.location.hash = newHash; // cập nhật URL
  };

  const handleGenerateHomeData = async () => {
    await generateHomePageData();
    toast.success("Genrate Home Data thành công!");
  };

  const tabs = [
    { key: "top_view", label: "Truyện Xem Nhiều" },
    { key: "top_love", label: "Truyện Yêu Thích" },
    { key: "banners", label: "Truyện Trên Banners" },
    { key: "trending_now", label: "Truyện Xu Hướng" },
    { key: "recommended", label: "Truyện Đề Cử" },
    { key: "latest", label: "Truyện Mới Cập Nhật" },
    { key: "limited_free", label: "Truyện Miễn Phí" },
    { key: "tien-hiep", label: "Top Tiên Hiệp" },
    { key: "huyen-huyen", label: "Top Huyền Huyễn" },
  ];

  return (
    <div className="container mx-auto pt-8">
      {/* Nút tạo Home Data */}
      <div className="flex justify-end mb-5">
        <button
          onClick={handleGenerateHomeData}
          className="px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded shadow cursor-pointer"
        >
          Tạo Home Data
        </button>
      </div>

      {/* Tabs Header */}
      <div className="flex justify-start gap-4 border-b border-gray-300 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleChangeTab(tab.key)}
            className={`px-6 py-2 text-sm font-semibold rounded-t-lg transition-all ${
              activeTab === tab.key
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabs Content */}
      <div className="mt-4">
        {activeTab === "top_view" && (
          <LeaderBoardEdit books={books} type="top_view" title="Truyện Xem Nhiều" />
        )}
        {activeTab === "top_love" && (
          <LeaderBoardEdit books={books} type="top_love" title="Truyện Yêu Thích" />
        )}
        {activeTab === "banners" && (
          <LeaderBoardEdit books={books} type="banners" title="Truyện Trên Banners" />
        )}
        {activeTab === "trending_now" && (
          <LeaderBoardEdit books={books} type="trending_now" title="Truyện Xu Hướng" />
        )}
        {activeTab === "recommended" && (
          <LeaderBoardEdit books={books} type="recommended" title="Truyện Đề Cử" />
        )}
        {activeTab === "latest" && (
          <LeaderBoardEdit books={books} type="latest" title="Truyện Mới Cập Nhật" />
        )}
        {activeTab === "limited_free" && (
          <LeaderBoardEdit books={books} type="limited_free" title="Truyện Miễn Phí" />
        )}
        {activeTab === "tien-hiep" && (
          <LeaderBoardEdit books={books} type="tien-hiep" title="Top Tiên Hiệp" category="tien-hiep"/>
        )}
        {activeTab === "huyen-huyen" && (
          <LeaderBoardEdit books={books} type="top_huyen_huyen" title="Top Huyền Huyễn" category="huyen-huyen"/>
        )}
      </div>
    </div>
  );
}
