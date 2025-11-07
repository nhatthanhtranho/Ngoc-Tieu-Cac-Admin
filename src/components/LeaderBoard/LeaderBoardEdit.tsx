"use client";

import { useState, useMemo, useEffect } from "react";
import { getLeaderboard, setLeaderboard } from "@/apis/leaderboard";
import { Search, Trash2, ArrowRightLeft, Save, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Book = { slug: string; title: string };

interface LeaderBoardEditProps {
  books: Book[];
  type: string;
  title: string;
}

export default function LeaderBoardEdit({
  books,
  title,
  type,
}: LeaderBoardEditProps) {
  const [leaderboard, setLeaderboardState] = useState<string[]>([]);
  const [available, setAvailable] = useState<Book[]>([]);
  const [draggedBook, setDraggedBook] = useState<Book | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLeaderboard(type, (data: string[]) => setLeaderboardState(data));
  }, [type]);

  useEffect(() => {
    setAvailable(books.filter((b) => !leaderboard?.includes(b.slug)));
  }, [books, leaderboard]);

  const filteredAvailable = useMemo(() => {
    if (!search.trim()) return available;
    const s = search.toLowerCase();
    return available.filter(
      (b) =>
        b.slug.toLowerCase().includes(s) || b.title.toLowerCase().includes(s)
    );
  }, [search, available]);

  const handleDragStart = (book: Book) => setDraggedBook(book);
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleDropToLeaderboard = () => {
    if (!draggedBook) return;
    if (!leaderboard.includes(draggedBook.slug)) {
      setLeaderboardState([...leaderboard, draggedBook.slug]);
    }
    setDraggedBook(null);
  };

  const handleRemoveFromLeaderboard = (slug: string) =>
    setLeaderboardState(leaderboard.filter((b) => b !== slug));

  const handleReorder = (hoverIndex: number) => {
    if (draggedBook && leaderboard.includes(draggedBook.slug)) {
      const newOrder = [...leaderboard];
      const fromIndex = newOrder.indexOf(draggedBook.slug);
      if (fromIndex !== hoverIndex) {
        newOrder.splice(fromIndex, 1);
        newOrder.splice(hoverIndex, 0, draggedBook.slug);
        setLeaderboardState(newOrder);
      }
    }
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

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Available Books */}
        <div className="flex-1 bg-white p-6 rounded-2xl shadow-md flex flex-col border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-500" />
              Danh sách sách ({available.length})
            </h3>
          </div>

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

          <div className="flex-1 overflow-y-auto max-h-[480px] border-t border-gray-200 pt-3 custom-scrollbar">
            <ul className="space-y-2">
              {filteredAvailable.map((book) => (
                <motion.li
                  key={book.slug}
                  layout
                  draggable
                  onDragStart={() => handleDragStart(book)}
                  className="p-3 bg-gray-50 hover:bg-gray-100 transition rounded-xl cursor-grab border border-gray-100"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="font-medium text-gray-800">{book.title}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{book.slug}</div>
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
        <div
          className="flex-1 bg-white p-6 rounded-2xl shadow-md flex flex-col border border-gray-100"
          onDragOver={handleDragOver}
          onDrop={handleDropToLeaderboard}
        >
          <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            🏆 Leaderboard ({leaderboard?.length})
          </h3>
          <div className="flex-1 overflow-y-auto max-h-[480px] border-t border-gray-200 pt-3 custom-scrollbar">
            <ul className="space-y-2">
              <AnimatePresence>
                {leaderboard?.map((slug, index) => (
                  <motion.li
                    key={slug}
                    layout
                    draggable
                    onDragStart={() => setDraggedBook({ slug, title: findBookTitle(slug) })}
                    onDragEnter={() => handleReorder(index)}
                    onDragEnd={() => setDraggedBook(null)}
                    whileHover={{ scale: 1.02 }}
                    className={`flex justify-between items-center p-3 rounded-xl border transition cursor-grab ${
                      dragOverIndex === index
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-gray-800">
                        #{index + 1} — {findBookTitle(slug)}
                      </div>
                      <div className="text-gray-400 text-xs mt-0.5">{slug}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromLeaderboard(slug)}
                      className="text-red-500 hover:text-red-600 p-1 rounded-full transition"
                      title="Xóa khỏi leaderboard"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>

              {leaderboard?.length === 0 && (
                <li className="text-gray-400 text-sm text-center py-6 italic">
                  Kéo sách vào đây để thêm vào leaderboard
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

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
