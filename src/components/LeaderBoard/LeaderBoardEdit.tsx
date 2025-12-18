"use client";

import { useState, useMemo, useEffect } from "react";
import { getLeaderboard, setLeaderboard } from "../../../apis/leaderboard";
import {
  Search,
  X,
  Save,
  BookOpen,
  Plus,
  ArrowUp,
  ArrowDown,
  Crown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TopTruyen from "../TopList/TopTruyen";

type Book = { slug: string; title: string };

interface LeaderBoardEditProps {
  books: Book[];
  type: string;
  title: string;
  generate?: () => void,
}

export default function LeaderBoardEdit({
  books,
  title,
  type,
  generate,
}: LeaderBoardEditProps) {
  const [leaderboard, setLeaderboardState] = useState<string[]>([]);
  const [available, setAvailable] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLeaderboard(type, (data: string[]) => setLeaderboardState(data));
  }, [type]);

  useEffect(() => {
    setAvailable(books.filter((b) => !leaderboard.includes(b.slug)));
  }, [books, leaderboard]);

  const filteredAvailable = useMemo(() => {
    if (!search.trim()) return available;
    const s = search.toLowerCase();
    return available.filter(
      (b) =>
        b.slug.toLowerCase().includes(s) || b.title.toLowerCase().includes(s)
    );
  }, [search, available]);

  const handleAddToLeaderboard = (slug: string) => {
    if (!leaderboard.includes(slug)) {
      setLeaderboardState([slug, ...leaderboard]);
    }
  };

  const handleRemoveFromLeaderboard = (slug: string) =>
    setLeaderboardState(leaderboard.filter((b) => b !== slug));

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newLeaderboard = [...leaderboard];
    [newLeaderboard[index - 1], newLeaderboard[index]] = [
      newLeaderboard[index],
      newLeaderboard[index - 1],
    ];
    setLeaderboardState(newLeaderboard);
  };

  const moveDown = (index: number) => {
    if (index === leaderboard.length - 1) return;
    const newLeaderboard = [...leaderboard];
    [newLeaderboard[index], newLeaderboard[index + 1]] = [
      newLeaderboard[index + 1],
      newLeaderboard[index],
    ];
    setLeaderboardState(newLeaderboard);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setLeaderboard(type, leaderboard);
      alert("✅ Lưu leaderboard thành công!");
    } catch (err) {
      console.error(err);
      alert("❌ Lưu leaderboard thất bại!");
    } finally {
      setSaving(false);
    }
  };

  const findBookTitle = (slug: string) =>
    books.find((b) => b.slug === slug)?.title || slug;

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-2">
        <BookOpen className="w-7 h-7 text-blue-600" /> {title}
      </h2>
      <TopTruyen bookSlugs={leaderboard} />

      {/* NÚT TẠO XẾP HẠNG */}
      {
        generate &&

        <div className="flex flex-row mt-10">
          <button
            onClick={
              async () => {
                await generate?.()
                window.location.reload();
              }

            }
            className="flex items-center gap-2 py-2 px-4
          rounded-xl bg-emerald-500 text-white
          shadow-md hover:bg-emerald-600 active:scale-95
          transition font-medium"
          >
            <Crown className="w-5 h-5" />
            Tạo danh sách xếp hạng
          </button>
        </div>
      }
      <div className="flex flex-col lg:flex-row gap-8 mt-5">
        {/* Available Books */}
        <div className="flex-1 bg-white p-6 rounded-2xl shadow-md flex flex-col border border-gray-100">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 p-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-700"
            />
          </div>

          <div className="flex-1 overflow-y-auto max-h-[530px] border-t border-gray-200 pt-3 custom-scrollbar">
            <ul className="space-y-2">
              {filteredAvailable.map((book) => (
                <motion.li
                  key={book.slug}
                  layout
                  whileHover={{ scale: 1.02 }}
                  className="flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition rounded-xl border border-gray-100"
                >
                  <div>
                    <div className="font-medium text-gray-800">
                      {book.title}
                    </div>
                    <div className="text-gray-400 text-xs mt-0.5">
                      {book.slug}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddToLeaderboard(book.slug)}
                    className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition"
                    title="Thêm vào leaderboard"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </motion.li>
              ))}
              {filteredAvailable.length === 0 && (
                <li className="text-gray-400 text-sm text-center py-6">
                  Không tìm thấy kết quả
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="flex-1 bg-white p-6 rounded-2xl shadow-md flex flex-col border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            Bảng xếp hạng ({leaderboard.length})
          </h3>
          <div className="flex-1 overflow-y-auto max-h-[480px] border-t border-gray-200 pt-3 custom-scrollbar">
            <ul className="space-y-2">
              <AnimatePresence>
                {leaderboard.map((slug, index) => (
                  <motion.li
                    key={slug}
                    layout
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className="relative flex p-3 rounded-xl border bg-gray-50 border-gray-100 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-2 mr-5">
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveUp(index)}
                          className="p-1 rounded bg-gray-200 hover:bg-gray-300 cursor-pointer transition"
                          title="Di chuyển lên"
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveDown(index)}
                          className="p-1 rounded bg-gray-200 hover:bg-gray-300 cursor-pointer transition"
                          title="Di chuyển xuống"
                          disabled={index === leaderboard.length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        #{index + 1} — {findBookTitle(slug)}
                      </div>
                      <div className="text-gray-400 text-xs mt-0.5">{slug}</div>
                    </div>

                    <button
                      onClick={() => handleRemoveFromLeaderboard(slug)}
                      className="absolute top-0 right-0 cursor-pointer hover:text-red-600 p-1 rounded-full transition"
                      title="Xóa khỏi leaderboard"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>

              {leaderboard.length === 0 && (
                <li className="text-gray-400 text-sm text-center py-6 italic">
                  Chưa có sách trong leaderboard
                </li>
              )}
            </ul>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-5 flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-700 hover:bg-zinc-800 cursor-pointer text-white font-medium rounded-lg disabled:bg-gray-400 transition"
          >
            {saving ? (
              <>
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" /> Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>
    </div >
  );
}
