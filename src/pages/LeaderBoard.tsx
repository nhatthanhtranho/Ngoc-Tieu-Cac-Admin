"use client";

import { useState, useEffect } from "react";
import BackToHomeButton from "../components/BackToHomeButton";
import { fetchAllBookSlugs } from "../../apis/books";
import LeaderBoardEdit from "../components/LeaderBoard/LeaderBoardEdit";

type Book = { slug: string; title: string };

export default function LeaderBoard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<string>("top_love");

  useEffect(() => {
    fetchAllBookSlugs((data: Book[]) => setBooks(data));
  }, []);

  const tabs = [
    { key: "top_love", label: "Truyện Yêu Thích" },
    { key: "trending_now", label: "Truyện Xu Hướng" },
    { key: "recommended", label: "Truyện Đề Cử" },
    { key: "limited_free", label: "Truyện Miễn Phí" },
  ] as const;

  return (
    <div className="container mx-auto pt-8">
      {/* Tabs Header */}
      <div className="flex justify-center gap-4 border-b border-gray-300 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
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
        {activeTab === "top_love" && (
          <LeaderBoardEdit
            books={books}
            type="top_love"
            title="Truyện Yêu Thích"
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

        {activeTab === "limited_free" && (
          <LeaderBoardEdit
            books={books}
            type="limited_free"
            title="Truyện Miễn Phí"
          />
        )}
      </div>
    </div>
  );
}
