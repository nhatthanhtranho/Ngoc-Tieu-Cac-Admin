"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

import { fetchAllBookSlugs } from "../../apis/books";
import LeaderBoardEdit from "../components/LeaderBoard/LeaderBoardEdit";
import { generateHomePageData } from "../../apis/leaderboard";
import { api } from "../../apis";
import { Bomb } from "lucide-react";

type Book = { slug: string; title: string; categories: string[], currentAudioChapter: string | null};

// 🔥 Đọc tab từ hash
function getTabFromHash() {
  const hash = window.location.hash;
  const [, queryString] = hash.split("?");
  const params = new URLSearchParams(queryString || "");
  return params.get("tab") || "banners-audio";
}

// ================================
// 🔥 CONFIG DUY NHẤT CHO TẤT CẢ TAB
// ================================
const TAB_CONFIG: Record<
  string,
  {
    label: string;
    type: string;
    category?: string;
    generate?: () => Promise<void>;
  }
> = {
  "banners-audio": { label: "Banners", type: "banners-audio" },
  // recommended: {
  //   label: "Đề Cử",
  //   type: "recommended",
  //   generate: async () => {
  //     await api.get(`/admin/generate-random-trendings`);
  //     toast.success("Đã tạo xong Top Tiên Hiệp!");
  //   },
  // },
  // discover: { label: "Khám phá", type: "discover" },

  // top_view: { label: "Xem Nhiều", type: "top_view" },
  // trending_now: { label: "Truyện Hot", type: "trending_now" },

  // hoan_thanh: {
  //   label: "Hoàn Thành",
  //   type: "hoan-thanh",
  //   generate: async () => {
  //     await api.get(`/admin/generate-trending?category=hoan-thanh`);
  //     toast.success("Đã tạo xong Top Tiên Hiệp!");
  //   },
  // },

  "latest-audio": {
    label: "Truyện Mới",
    type: "latest-audio",
    generate: async () => {
      await api.get(`/admin/generate-trending-latest-audio`);
      toast.success("Đã tạo xong Top Audio Mới!");
    },
  },
  // "latest-chapters": {
  //   label: "Truyện Hot",
  //   type: "latest-chapter",
  // },

  // "mien-phi": {
  //   label: "Miễn Phí",
  //   type: "mien-phi",
  //   category: "mien-phi",

  //   generate: async () => {
  //     await api.get(`/admin/generate-trending?category=mien-phi`);
  //     toast.success("Đã tạo xong Top Miễn Phí!");
  //   },
  // },
  // "premium": {
  //   label: "Premium mỗi tuần",
  //   type: "premium",
  //   category: "premium",

  //   generate: async () => {
  //     await api.get(`/admin/generate-trending?category=premium?limit=10`);
  //     toast.success("Đã tạo xong Top Premium Mỗi Tuần");
  //   },
  // },

  // // ====== Thể loại =============
  // "tien-hiep": {
  //   label: "Tiên Hiệp",
  //   type: "tien-hiep",
  //   category: "tien-hiep",

  //   generate: async () => {
  //     await api.get(`/admin/generate-trending?category=tien-hiep`);
  //     toast.success("Đã tạo xong Top Tiên Hiệp!");
  //   },
  // },
  // "huyen-huyen": {
  //   label: "Huyền Huyễn",
  //   type: "huyen-huyen",
  //   category: "huyen-huyen",

  //   generate: async () => {
  //     await api.get(`/admin/generate-trending?category=huyen-huyen`);
  //     toast.success("Đã tạo xong Top Huyền Huyễn!");
  //   },
  // },
  // "do-thi": {
  //   label: "Đô Thị",
  //   type: "do-thi",
  //   category: "do-thi",

  //   generate: async () => {
  //     await api.get(`/admin/generate-trending?category=do-thi`);
  //     toast.success("Đã tạo xong Top Đô Thị!");
  //   },
  // },
  // "linh-di": {
  //   label: "Linh Dị",
  //   type: "linh-di",
  //   category: "linh-di",

  //   generate: async () => {
  //     await api.get(`/admin/generate-trending?category=linh-di`);
  //     toast.success("Đã tạo xong Top Linh Dị!");
  //   },
  // },
  // "trinh-tham": {
  //   label: "Trinh Thám",
  //   type: "trinh-tham",
  //   category: "trinh-tham",

  //   generate: async () => {
  //     await api.get(`/admin/generate-trending?category=trinh-tham`);
  //     toast.success("Đã tạo xong Top Trinh Thám!");
  //   },
  // },
  // "he-thong": {
  //   label: "Hệ Thống",
  //   type: "he-thong",
  //   category: "he-thong",

  //   generate: async () => {
  //     await api.get(`/admin/generate-trending?category=he-thong`);
  //     toast.success("Đã tạo xong Top Hệ Thống!");
  //   },
  // },

  // "di-gioi": {
  //   label: "Top Dị Giới",
  //   type: "di-gioi",
  //   category: "di-gioi",

  //   generate: async () => {
  //     await api.get(`/admin/generate-trending?category=di-gioi`);
  //     toast.success("Đã tạo xong Top Dị Giới!");
  //   },
  // },
  // "co-tri": {
  //   label: "Top Cơ Trí",
  //   type: "co-tri",
  //   category: "co-tri",

  //   generate: async () => {
  //     await api.get(`/admin/generate-trending?category=co-tri`);
  //     toast.success("Đã tạo xong Top Cơ Trí!");
  //   },
  // },

  // "trong-sinh": {
  //   label: "Trọng Sinh",
  //   type: "trong-sinh",
  //   category: "trong-sinh",

  //   generate: async () => {
  //     await api.get(`/admin/generate-trending?category=trong-sinh`);
  //     toast.success("Đã tạo xong Top Trọng Sinh!");
  //   },
  // },
  // "hai-huoc": {
  //   label: "Hài Hước",
  //   type: "hai-huoc",
  //   category: "trong-sinh",
  //   generate: async () => {
  //     await api.get(`/admin/generate-trending?category=hai-huoc`);
  //     toast.success("Đã tạo xong Top Hài Hước!");
  //   },
  // },
};

export default function LeaderBoardAudio() {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<string>(getTabFromHash());
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

  // 🔥 Đổi tab
  const handleChangeTab = (tab: string) => {
    setActiveTab(tab);

    const hash = window.location.hash;
    const [path, queryString] = hash.split("?");
    const params = new URLSearchParams(queryString || "");
    params.set("tab", tab);

    window.location.hash = `${path}?${params.toString()}`;
  };

  // 🔥 Generate Home Data
  const handleGenerateHomeData = async () => {
    try {
      setLoadingOverlay(true);
      await generateHomePageData();
      toast.success("Generate Home Data thành công!");
    } catch {
      toast.error("Lỗi khi generate Home Data");
    } finally {
      setLoadingOverlay(false);
    }
  };

  // 🔥 Generate Home Data
  const handleGenerateTop = async () => {
    try {
      setLoadingOverlay(true);

      // Lọc các tab có hàm generate
      const tabsWithGenerate = Object.values(TAB_CONFIG).filter(
        (tab) => tab.generate
      );

      // Chạy tuần tự tất cả các generate
      for (const tab of tabsWithGenerate) {
        await tab.generate?.();
      }

      toast.success("Đã tạo xong tất cả các Top!");
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tạo các Top");
    } finally {
      setLoadingOverlay(false);
    }
  };

  const currentTab = useMemo(() => {
    return TAB_CONFIG[activeTab];
  }, [activeTab, TAB_CONFIG]);

  const filteredBook = useMemo(() => {
    if (!currentTab?.category) {
      return books.filter((b) => b.currentAudioChapter!);
    }
    return books.filter((item) =>
      item?.categories?.includes(currentTab?.category as any)
    ).filter(b => b.currentAudioChapter!);
  }, [currentTab?.category, books]);

  return (
    <div className="container mx-auto pt-8">
      {loadingOverlay && (
        <div className="fixed inset-0 bg-black/50 z-999 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="flex justify-end mb-5 flex-row gap-3">
        <button
          onClick={handleGenerateTop}
          disabled={loadingOverlay}
          className={`px-4 py-2 rounded shadow cursor-pointer flex items-center gap-2 text-white 
            ${loadingOverlay
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
            }
          `}
        >
          <Bomb />

          {loadingOverlay && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          )}
          {loadingOverlay ? "Đang tạo..." : "Tạo Top"}
        </button>

        <button
          onClick={handleGenerateHomeData}
          disabled={loadingOverlay}
          className={`px-4 py-2 rounded shadow cursor-pointer flex items-center gap-2 text-white 
            ${loadingOverlay
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-emerald-500 hover:bg-emerald-600"
            }
          `}
        >
          {loadingOverlay && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          )}
          {loadingOverlay ? "Đang tạo..." : "Tạo Home Data"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 overflow-x-auto whitespace-nowrap no-scrollbar border-b border-gray-300 mb-6">
        {Object.entries(TAB_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => handleChangeTab(key)}
            className={`px-6 py-2 text-sm font-semibold rounded-t-lg transition-all ${activeTab === key
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
              }`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {currentTab && (
        <LeaderBoardEdit
          books={filteredBook}
          type={currentTab.type}
          title={currentTab.label}
          generate={currentTab.generate}
        />
      )}
    </div>
  );
}
