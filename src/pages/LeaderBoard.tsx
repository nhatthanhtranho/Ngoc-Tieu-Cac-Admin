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

  const handleGenerateHomeData = async () => {
    await generateHomePageData();
    toast.success("Genrate Home Data thành công!");
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

  const tabs = [
    { key: "top_view", label: "Truyện Xem Nhiều" },
    { key: "top_love", label: "Truyện Yêu Thích" },
    { key: "banners", label: "Truyện Trên Banners" },
    { key: "trending_now", label: "Truyện Xu Hướng" },
    { key: "recommended", label: "Truyện Đề Cử" },
    { key: "latest", label: "Truyện Mới Cập Nhật" },
    { key: "limited_free", label: "Truyện Miễn Phí" },

    // Thể loại
    { key: "tien-hiep", label: "Top Tiên Hiệp" },
    { key: "huyen-ao", label: "Top Huyền Ảo" },
    { key: "do-thi", label: "Top Đô Thị" },
    { key: "hai-huoc", label: "Top Hài Hước" },
    { key: "co-dai", label: "Top Cổ Đại" },
    { key: "kiem-hiep", label: "Top Kiếm Hiệp" },
    { key: "tu-chan", label: "Top Tu Chân" },
    { key: "linh-di", label: "Top Linh Dị" },
    { key: "trinh-tham", label: "Top Trinh Thám" },
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

      {/* Tabs Header - scroll ngang */}
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
          <LeaderBoardEdit books={books} type="latest" title="Truyện Mới Cập Nhật" generate={() => {
            handleGenerateLeaderBoardLatest()
          }} />
        )}

        {activeTab === "limited_free" && (
          <LeaderBoardEdit books={books} type="limited_free" title="Truyện Miễn Phí" />
        )}

        {/* --- Thể loại --- */}
        {activeTab === "tien-hiep" && (
          <LeaderBoardEdit books={books} type="tien-hiep" title="Top Tiên Hiệp" generate={() => handleGenerateLeaderBoard("tien-hiep")} />
        )}

        {activeTab === "huyen-ao" && (
          <LeaderBoardEdit books={books} type="huyen-ao" title="Top Huyền Ảo" generate={() => handleGenerateLeaderBoard("huyen-ao")} />
        )}

        {activeTab === "do-thi" && (
          <LeaderBoardEdit books={books} type="do-thi" title="Top Đô Thị" generate={() => handleGenerateLeaderBoard("do-thi")} />
        )}

        {activeTab === "hai-huoc" && (
          <LeaderBoardEdit books={books} type="hai-huoc" title="Top Hài Hước" generate={() => handleGenerateLeaderBoard("hai-huoc")} />
        )}

        {activeTab === "co-dai" && (
          <LeaderBoardEdit books={books} type="co-dai" title="Top Cổ Đại" generate={() => handleGenerateLeaderBoard("co-dai")} />
        )}

        {activeTab === "kiem-hiep" && (
          <LeaderBoardEdit books={books} type="kiem-hiep" title="Top Kiếm Hiệp" generate={() => handleGenerateLeaderBoard("kiem-hiep")} />
        )}

        {activeTab === "tu-chan" && (
          <LeaderBoardEdit books={books} type="tu-chan" title="Top Tu Chân" generate={() => handleGenerateLeaderBoard("tu-chan")} />
        )}

        {activeTab === "linh-di" && (
          <LeaderBoardEdit books={books} type="linh-di" title="Top Linh Dị" generate={() => handleGenerateLeaderBoard("linh-di")} />
        )}

        {activeTab === "trinh-tham" && (
          <LeaderBoardEdit books={books} type="trinh-tham" title="Top Trinh Thám" generate={() => handleGenerateLeaderBoard("trinh-tham")} />
        )}
      </div>
    </div>
  );
}
